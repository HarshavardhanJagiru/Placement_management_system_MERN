import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import { protect, adminOnly, studentOnly } from '../middlewares/auth.js';
import uploadResume from '../middlewares/upload.js';
import path from 'path';

const router = express.Router();

// @desc    Get current student profile
// @route   GET /api/student/profile
// @access  Private (Student only)
router.get('/profile', protect, studentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'username email');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update student profile (with optional resume upload)
// @route   POST /api/student/profile
// @access  Private (Student only)
router.post('/profile', protect, studentOnly, uploadResume.single('resume_file'), async (req, res) => {
  const { fullName, department, cgpa, skills } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (fullName) student.fullName = fullName;
    if (department !== undefined) student.department = department;
    if (cgpa !== undefined) student.cgpa = parseFloat(cgpa);
    
    if (skills !== undefined) {
      // Process comma-separated string into array
      student.skills = skills.split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (req.file) {
      student.resumeFilename = req.file.filename;
    }

    await student.save();
    
    // Fetch updated student with user details
    const updatedStudent = await Student.findById(student._id).populate('userId', 'username email');
    res.json({ message: 'Profile updated successfully!', student: updatedStudent });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete own student account
// @route   POST /api/student/delete-account
// @access  Private (Student only)
router.post('/delete-account', protect, studentOnly, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (student) {
      // 1. Delete applications
      await Application.deleteMany({ studentId: student._id });
    }

    // 2. Delete notifications
    await Notification.deleteMany({ userId: req.user._id });

    // 3. Delete student profile
    if (student) {
      await Student.deleteOne({ _id: student._id });
    }

    // 4. Delete user account
    await User.deleteOne({ _id: req.user._id });

    res.json({ message: 'Your account has been permanently deleted.' });
  } catch (error) {
    console.error('Account delete error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a student account (Admin only)
// @route   POST /api/student/delete-student/:userId
// @access  Private (Admin only)
router.post('/delete-student/:userId', protect, adminOnly, async (req, res) => {
  const { userId } = req.params;

  try {
    const student = await Student.findOne({ userId });
    if (student) {
      // Delete applications
      await Application.deleteMany({ studentId: student._id });
      // Delete student profile
      await Student.deleteOne({ _id: student._id });
    }

    // Delete notifications
    await Notification.deleteMany({ userId });

    // Delete user account
    const result = await User.deleteOne({ _id: userId, role: 'student' });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    res.json({ message: 'Student account deleted successfully.' });
  } catch (error) {
    console.error('Admin delete student error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all students (Admin only)
// @route   GET /api/student/all
// @access  Private (Admin only)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'username email');
    
    // Format response to match expectations
    const formattedList = students.map(s => ({
      user_id: s.userId?._id,
      id: s._id,
      username: s.userId?.username,
      email: s.userId?.email,
      full_name: s.fullName,
      department: s.department,
      cgpa: s.cgpa
    }));
    
    res.json(formattedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Filter students (Admin only)
// @route   POST /api/student/filter
// @access  Private (Admin only)
router.post('/filter', protect, adminOnly, async (req, res) => {
  const { department, min_cgpa } = req.body;

  try {
    let query = {};
    if (department && department !== 'all') {
      query.department = department;
    }
    if (min_cgpa) {
      query.cgpa = { $gte: parseFloat(min_cgpa) };
    }

    const students = await Student.find(query).populate('userId', 'username email');
    
    const formattedList = students.map(s => ({
      id: s.userId?._id, // User ID matching bulk form value checkbox
      full_name: s.fullName,
      username: s.userId?.username,
      email: s.userId?.email,
      department: s.department,
      cgpa: s.cgpa
    }));

    res.json(formattedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
