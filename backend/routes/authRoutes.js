import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { protect } from '../middlewares/auth.js';
import { sendOtpEmail, sendResetOtpEmail } from '../services/emailService.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'superSecretJwtTokenKey123!@#', {
    expiresIn: '30d'
  });
};

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// @desc    Register a new student user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, fullName, department, cgpa } = req.body;

  try {
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character.' 
      });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Create User (defaults to student role)
    const user = new User({
      username,
      email,
      password,
      role: 'student',
      isVerified: false,
      otpCode,
      otpExpiry
    });
    await user.save();

    // Create Student entry
    const student = new Student({
      userId: user._id,
      fullName,
      department: department || '',
      cgpa: cgpa ? parseFloat(cgpa) : 0.0
    });
    await student.save();

    // Send OTP email
    console.log(`Sending verification OTP to ${email}...`);
    await sendOtpEmail(email, otpCode);

    res.status(201).json({
      message: 'Registration pending. Verification code sent to email.',
      pendingUserId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { pendingUserId, otpCode } = req.body;

  try {
    if (!pendingUserId || !otpCode) {
      return res.status(400).json({ message: 'Invalid verification details' });
    }

    const user = await User.findById(pendingUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
    }

    // Activate user
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    const student = await Student.findOne({ userId: user._id });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      studentDetails: student,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check email verification status
    if (!user.isVerified) {
      // Re-trigger OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, otpCode);

      return res.status(403).json({
        message: 'Please verify your email address before logging in.',
        notVerified: true,
        pendingUserId: user._id
      });
    }

    const student = await Student.findOne({ userId: user._id });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      studentDetails: student,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendResetOtpEmail(email, otpCode);

    res.json({ message: 'Password reset code sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, otpCode, newPassword, confirmPassword } = req.body;

  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character.' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid reset code.' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Reset code has expired.' });
    }

    user.password = newPassword;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Change logged-in user password
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character.' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
