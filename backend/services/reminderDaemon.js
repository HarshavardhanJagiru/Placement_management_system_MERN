import Application from '../models/Application.js';
import { sendInterviewReminder } from './emailService.js';

const startReminderDaemon = () => {
  // Check every hour (3600000 ms)
  const INTERVAL_MS = 3600000;

  const runReminderCheck = async () => {
    console.log('[Reminder Daemon] Running 24h interview reminder check...');
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find applications with status 'interview', reminderSent = false,
      // and interviewDate within the next 24 hours
      const upcomingApplications = await Application.find({
        status: 'interview',
        reminderSent: false,
        interviewDate: { $lte: tomorrow, $gt: now }
      })
      .populate('jobId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId' }
      });

      for (const app of upcomingApplications) {
        const email = app.studentId?.userId?.email;
        const fullName = app.studentId?.fullName;
        const company = app.jobId?.companyName;
        const position = app.jobId?.position;
        const interviewDateStr = app.interviewDate ? app.interviewDate.toLocaleString() : 'tomorrow';

        if (email && fullName && company && position) {
          console.log(`[Reminder Daemon] Sending reminder email to ${email} for position ${position} at ${company}...`);
          const success = await sendInterviewReminder(email, fullName, company, position, interviewDateStr);
          if (success) {
            app.reminderSent = true;
            await app.save();
            console.log(`[Reminder Daemon] Successfully sent reminder and flagged application ID ${app._id}.`);
          }
        }
      }
    } catch (error) {
      console.error('[Reminder Daemon] Error in checking interview reminders:', error);
    }
  };

  // Run immediately on boot and then periodically
  runReminderCheck();
  setInterval(runReminderCheck, INTERVAL_MS);
};

export default startReminderDaemon;
