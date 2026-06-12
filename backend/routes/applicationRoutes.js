import express from 'express';
import Application from '../models/Application.js';
import Student from '../models/Student.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect, adminOnly, studentOnly } from '../middlewares/auth.js';
import { sendInterviewAlert, sendCustomEmail, sendInterviewReminder } from '../services/emailService.js';

const router = express.Router();

// @desc    Get current student's applications
// @route   GET /api/applications/student
// @access  Private (Student only)
router.get('/student', protect, studentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const applications = await Application.find({ studentId: student._id })
      .populate('jobId')
      .sort({ dateApplied: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Apply for a job
// @route   POST /api/applications/apply/:jobId
// @access  Private (Student only)
router.post('/apply/:jobId', protect, studentOnly, async (req, res) => {
  const { jobId } = req.params;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    // Check CGPA eligibility
    if (student.cgpa < job.minCgpa) {
      return res.status(400).json({ 
        message: `You are not eligible for this job. Minimum CGPA required: ${job.minCgpa}. Your CGPA: ${student.cgpa}.`
      });
    }

    // Check if application already exists
    let application = await Application.findOne({ jobId, studentId: student._id });

    if (application) {
      if (application.status === 'saved') {
        application.status = 'applied';
        application.dateApplied = new Date();
        await application.save();
        return res.json({ message: 'Application submitted successfully!', application });
      } else {
        return res.status(400).json({ message: 'You have already applied for this job.' });
      }
    }

    application = new Application({
      jobId,
      studentId: student._id,
      status: 'applied'
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Save a job to board
// @route   POST /api/applications/save/:jobId
// @access  Private (Student only)
router.post('/save/:jobId', protect, studentOnly, async (req, res) => {
  const { jobId } = req.params;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const application = await Application.findOne({ jobId, studentId: student._id });
    if (application) {
      return res.status(400).json({ message: 'Job is already tracked in your applications.' });
    }

    const newApp = new Application({
      jobId,
      studentId: student._id,
      status: 'saved'
    });

    await newApp.save();
    res.status(201).json({ message: 'Job saved to Need to Apply!', application: newApp });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update application status via AJAX (Kanban drag & drop)
// @route   POST /api/applications/update-status-ajax
// @access  Private (Student only)
router.post('/update-status-ajax', protect, studentOnly, async (req, res) => {
  const { app_id, new_status } = req.body;

  const validStatuses = ['saved', 'applied', 'in_progress', 'interview', 'offered', 'rejected'];
  if (!validStatuses.includes(new_status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const application = await Application.findOne({ _id: app_id, studentId: student._id });
    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    // LOCK: Prevent students from moving offered/rejected cards finalized by admin
    if (['offered', 'rejected'].includes(application.status)) {
      return res.status(403).json({ 
        message: 'This application has been finalized by the admin and cannot be moved.' 
      });
    }

    application.status = new_status;
    await application.save();

    res.json({ success: true, message: 'Status updated successfully!' });
  } catch (error) {
    console.error('Kanban drag error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all applications (Admin only)
// @route   GET /api/applications/admin
// @access  Private (Admin only)
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const rawApps = await Application.find()
      .populate('jobId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'username email' }
      })
      .sort({ dateApplied: -1 });

    // Calculate match score
    const applications = rawApps.map(app => {
      let matchScore = 0;
      const job = app.jobId;
      const student = app.studentId;

      if (student && student.skills && job && job.requiredSkills) {
        const sSkills = new Set(student.skills.map(s => s.trim().toLowerCase()));
        const jSkills = new Set(job.requiredSkills.map(s => s.trim().toLowerCase()));

        if (jSkills.size > 0) {
          const intersection = [...sSkills].filter(skill => jSkills.has(skill));
          matchScore = Math.round((intersection.length / jSkills.size) * 100);
        }
      }

      return {
        _id: app._id,
        status: app.status,
        interviewDate: app.interviewDate,
        dateApplied: app.dateApplied,
        reminderSent: app.reminderSent,
        position: job ? job.position : 'Unknown Position',
        companyName: job ? job.companyName : 'Unknown Company',
        jobSkills: job ? job.requiredSkills.join(', ') : '',
        fullName: student ? student.fullName : 'Unknown Student',
        studentSkills: student ? student.skills.join(', ') : '',
        resumeFilename: student ? student.resumeFilename : null,
        matchScore
      };
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get admin statistics
// @route   GET /api/applications/stats/admin
// @access  Private (Admin only)
router.get('/stats/admin', protect, adminOnly, async (req, res) => {
  try {
    // 1. Application status metrics
    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const stats_dict = {};
    statusCounts.forEach(s => {
      stats_dict[s._id] = s.count;
    });

    // 2. Department distribution
    const deptStats = await Student.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { department: '$_id', count: 1, _id: 0 } }
    ]);

    // 3. Top Companies
    const companyStats = await Job.aggregate([
      { $group: { _id: '$companyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { company_name: '$_id', count: 1, _id: 0 } }
    ]);

    // 4. Student total
    const studentCount = await Student.countDocuments();

    res.json({
      stats_dict,
      dept_stats: deptStats,
      company_stats: companyStats,
      student_count: studentCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student dashboard stats
// @route   GET /api/applications/stats/student
// @access  Private (Student only)
router.get('/stats/student', protect, studentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const statusCounts = await Application.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats_dict = {};
    statusCounts.forEach(s => {
      stats_dict[s._id] = s.count;
    });

    res.json({ stats_dict });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get admin interview events for calendar
// @route   GET /api/applications/calendar/admin
// @access  Private (Admin only)
router.get('/calendar/admin', protect, adminOnly, async (req, res) => {
  try {
    const interviews = await Application.find({
      status: 'interview',
      interviewDate: { $ne: null }
    })
      .populate('jobId')
      .populate('studentId');

    const events = interviews.map(inv => ({
      id: inv._id,
      title: `${inv.studentId?.fullName || 'Student'} - ${inv.jobId?.companyName || 'Company'}`,
      start: inv.interviewDate.toISOString(),
      color: '#20c997' // Teal color
    }));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student interview events for calendar
// @route   GET /api/applications/calendar/student
// @access  Private (Student only)
router.get('/calendar/student', protect, studentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const interviews = await Application.find({
      studentId: student._id,
      status: 'interview',
      interviewDate: { $ne: null }
    }).populate('jobId');

    const events = interviews.map(inv => ({
      id: inv._id,
      title: `Interview: ${inv.jobId?.companyName} (${inv.jobId?.position})`,
      start: inv.interviewDate.toISOString(),
      color: '#20c997'
    }));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Admin updates application status
// @route   PUT /api/applications/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['applied', 'in_progress', 'interview', 'offered', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('studentId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // Create Notification
    const labels = {
      offered: '🎉 Congratulations! You received an Offer',
      rejected: '❌ Unfortunately, your application was Rejected',
      interview: '📅 You have been scheduled for an Interview',
      applied: '📝 Your application has been received',
      in_progress: '⚙️ Your application is currently under review'
    };
    const msg = `${labels[status]} for ${application.jobId?.position} at ${application.jobId?.companyName}.`;
    
    await Notification.create({
      userId: application.studentId.userId,
      message: msg
    });

    res.json({ message: `Application status updated to ${status}!`, application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Admin schedules interview
// @route   POST /api/applications/:id/schedule-interview
// @access  Private (Admin only)
router.post('/:id/schedule-interview', protect, adminOnly, async (req, res) => {
  const { interview_date } = req.body;

  try {
    if (!interview_date) {
      return res.status(400).json({ message: 'Please provide an interview date and time.' });
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId' }
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'interview';
    application.interviewDate = new Date(interview_date);
    application.reminderSent = false; // reset reminder tag
    await application.save();

    // Create notification
    const msg = `📅 Interview Scheduled for ${application.jobId?.position} at ${application.jobId?.companyName} on ${interview_date}.`;
    await Notification.create({
      userId: application.studentId.userId._id,
      message: msg
    });

    // Send Email Alert
    const email = application.studentId?.userId?.email;
    const fullName = application.studentId?.fullName;
    const company = application.jobId?.companyName;
    const position = application.jobId?.position;

    if (email && fullName && company && position) {
      console.log(`Sending interview alert email to ${email}...`);
      await sendInterviewAlert(email, fullName, company, position, new Date(interview_date).toLocaleString());
    }

    res.json({ message: 'Interview successfully scheduled!', application });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send bulk custom messages to selected students
// @route   POST /api/applications/bulk-email
// @access  Private (Admin only)
router.post('/bulk-email', protect, adminOnly, async (req, res) => {
  const { studentIds, subject, body } = req.body;

  if (!studentIds || studentIds.length === 0 || !subject || !body) {
    return res.status(400).json({ message: 'Please select recipients and fill in message details' });
  }

  try {
    const recipients = await User.find({ _id: { $in: studentIds } });
    let successCount = 0;

    for (const rec of recipients) {
      const success = await sendCustomEmail(rec.email, subject, body);
      if (success) successCount++;
    }

    res.json({ message: `Successfully sent messages to ${successCount} students.` });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Admin manually triggers interview reminder email
// @route   POST /api/applications/:id/send-reminder
// @access  Private (Admin only)
router.post('/:id/send-reminder', protect, adminOnly, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId' }
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'interview') {
      return res.status(400).json({ message: 'Can only send reminders for applications scheduled for interviews' });
    }

    const email = application.studentId?.userId?.email;
    const fullName = application.studentId?.fullName;
    const company = application.jobId?.companyName;
    const position = application.jobId?.position;
    const dateTime = application.interviewDate ? new Date(application.interviewDate).toLocaleString() : 'tomorrow';

    if (!email || !fullName || !company || !position) {
      return res.status(400).json({ message: 'Application lacks sufficient details to send reminder email.' });
    }

    console.log(`[Manual Reminder] Sending interview reminder email to ${email} for position ${position} at ${company}...`);
    const success = await sendInterviewReminder(email, fullName, company, position, dateTime);

    if (success) {
      application.reminderSent = true;
      await application.save();
      return res.json({ message: 'Interview reminder successfully sent!' });
    } else {
      return res.status(500).json({ message: 'Failed to send reminder email. Please check email configuration.' });
    }
  } catch (error) {
    console.error('Manual send-reminder error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
