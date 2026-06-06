import express from 'express';
import Job from '../models/Job.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private (Authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Post a new job
// @route   POST /api/jobs
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { companyName, position, salary, deadline, description, requiredSkills, minCgpa } = req.body;

  try {
    if (!companyName || !position || !salary || !deadline) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const skillsArray = requiredSkills
      ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const job = new Job({
      companyName,
      position,
      salary,
      deadline: new Date(deadline),
      description: description || '',
      requiredSkills: skillsArray,
      minCgpa: minCgpa ? parseFloat(minCgpa) : 0.0
    });

    await job.save();
    res.status(201).json({ message: 'Job posted successfully!', job });
  } catch (error) {
    console.error('Add job error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { companyName, position, salary, deadline, description, requiredSkills, minCgpa } = req.body;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    if (companyName) job.companyName = companyName;
    if (position) job.position = position;
    if (salary) job.salary = salary;
    if (deadline) job.deadline = new Date(deadline);
    if (description !== undefined) job.description = description;
    
    if (requiredSkills !== undefined) {
      job.requiredSkills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (minCgpa !== undefined) job.minCgpa = parseFloat(minCgpa);

    await job.save();
    res.json({ message: 'Job updated successfully!', job });
  } catch (error) {
    console.error('Edit job error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    await Job.deleteOne({ _id: req.params.id });
    res.json({ message: 'Job deleted successfully!' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
