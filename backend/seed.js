import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import Job from './models/Job.js';
import Application from './models/Application.js';
import Notification from './models/Notification.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_db');
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Student.deleteMany();
    await Job.deleteMany();
    await Application.deleteMany();
    await Notification.deleteMany();
    console.log('Database cleared!');

    // 1. Seed Admin User
    const adminUser = new User({
      username: 'admin',
      email: 'admin@university.edu',
      password: 'AdminPassword!23',
      role: 'admin',
      isVerified: true
    });
    await adminUser.save();
    console.log('Admin user seeded.');

    // 2. Seed Student Users & Student Profiles
    const studentUser1 = new User({
      username: 'harsha',
      email: 'harsha@university.edu',
      password: 'StudentPassword!123',
      role: 'student',
      isVerified: true
    });
    await studentUser1.save();

    const studentProfile1 = new Student({
      userId: studentUser1._id,
      fullName: 'Harshavardhan Jagiru',
      department: 'Computer Science',
      cgpa: 8.85,
      skills: ['React', 'Node.js', 'MongoDB', 'Python', 'SQL']
    });
    await studentProfile1.save();

    const studentUser2 = new User({
      username: 'rahul',
      email: 'rahul@university.edu',
      password: 'StudentPassword!123',
      role: 'student',
      isVerified: true
    });
    await studentUser2.save();

    const studentProfile2 = new Student({
      userId: studentUser2._id,
      fullName: 'Rahul Sharma',
      department: 'Information Technology',
      cgpa: 7.90,
      skills: ['Java', 'SQL', 'HTML', 'CSS', 'JavaScript']
    });
    await studentProfile2.save();

    const studentUser3 = new User({
      username: 'priya',
      email: 'priya@university.edu',
      password: 'StudentPassword!123',
      role: 'student',
      isVerified: true
    });
    await studentUser3.save();

    const studentProfile3 = new Student({
      userId: studentUser3._id,
      fullName: 'Priya Patel',
      department: 'Electronics',
      cgpa: 9.10,
      skills: ['C++', 'Python', 'Machine Learning', 'AWS']
    });
    await studentProfile3.save();
    console.log('Students seeded.');

    // 3. Seed Jobs
    const job1 = new Job({
      companyName: 'Google',
      position: 'Software Engineer',
      salary: '25 LPA',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      description: 'Join the Google team to build next generation cloud applications.',
      requiredSkills: ['Python', 'Go', 'Distributed Systems'],
      minCgpa: 8.5
    });
    await job1.save();

    const job2 = new Job({
      companyName: 'Microsoft',
      position: 'Technical Consultant',
      salary: '18 LPA',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      description: 'Help enterprise clients build state-of-the-art Azure cloud applications.',
      requiredSkills: ['SQL', 'C#', 'Cloud Architecture'],
      minCgpa: 8.0
    });
    await job2.save();

    const job3 = new Job({
      companyName: 'TCS',
      position: 'System Engineer',
      salary: '7 LPA',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      description: 'Work on large-scale digital transformation projects.',
      requiredSkills: ['Java', 'HTML', 'SQL', 'CSS'],
      minCgpa: 6.5
    });
    await job3.save();

    const job4 = new Job({
      companyName: 'Meta',
      position: 'Frontend Developer',
      salary: '22 LPA',
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      description: 'Innovate inside the UI engineering team building high-performance web systems.',
      requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML'],
      minCgpa: 8.0
    });
    await job4.save();
    console.log('Jobs seeded.');

    // 4. Seed Applications
    // Student 1 (Harsha - CGPA 8.85)
    // Applied to Google (match score should be high because of Python/SQL/React)
    const app1 = new Application({
      jobId: job1._id,
      studentId: studentProfile1._id,
      status: 'applied',
      dateApplied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await app1.save();

    // Saved Microsoft
    const app2 = new Application({
      jobId: job2._id,
      studentId: studentProfile1._id,
      status: 'saved',
      dateApplied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    await app2.save();

    // Student 2 (Rahul - CGPA 7.90)
    // Applied to TCS (Status Offered)
    const app3 = new Application({
      jobId: job3._id,
      studentId: studentProfile2._id,
      status: 'offered',
      dateApplied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    await app3.save();

    // Student 3 (Priya - CGPA 9.10)
    // Applied to Microsoft (Status Interview, scheduled 2 days from now)
    const app4 = new Application({
      jobId: job2._id,
      studentId: studentProfile3._id,
      status: 'interview',
      interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      dateApplied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });
    await app4.save();

    console.log('Applications seeded.');

    // 5. Seed Notifications
    await Notification.create({
      userId: studentUser3._id,
      message: `📅 Interview Scheduled for Microsoft - Technical Consultant on ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleString()}.`
    });

    await Notification.create({
      userId: studentUser2._id,
      message: '🎉 Congratulations! You received an Offer for TCS - System Engineer.'
    });
    console.log('Notifications seeded.');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
