import express from 'express';
import Notification from '../models/Notification.js';
import { protect, studentOnly } from '../middlewares/auth.js';

const router = express.Router();

// @desc    Get all notifications for logged-in user and mark them read
// @route   GET /api/notifications
// @access  Private (Student only)
router.get('/', protect, studentOnly, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    // Mark all as read
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private (Student only)
router.get('/unread-count', protect, studentOnly, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Clear all notifications for user
// @route   DELETE /api/notifications/clear
// @access  Private (Student only)
router.delete('/clear', protect, studentOnly, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications have been cleared.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Student only)
router.delete('/:id', protect, studentOnly, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    await Notification.deleteOne({ _id: req.params.id });
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
