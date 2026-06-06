import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: ''
  },
  cgpa: {
    type: Number,
    default: 0.0
  },
  skills: {
    type: [String],
    default: []
  },
  resumeFilename: {
    type: String,
    default: null
  }
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
