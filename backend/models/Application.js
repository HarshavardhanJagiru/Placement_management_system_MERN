import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'in_progress', 'interview', 'offered', 'rejected'],
    default: 'applied'
  },
  interviewDate: {
    type: Date,
    default: null
  },
  dateApplied: {
    type: Date,
    default: Date.now
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;
