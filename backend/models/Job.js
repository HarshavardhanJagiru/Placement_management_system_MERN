import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  salary: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  minCgpa: {
    type: Number,
    default: 0.0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Job = mongoose.model('Job', jobSchema);
export default Job;
