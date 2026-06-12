import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import {
  Briefcase,
  FileSpreadsheet,
  PlusCircle,
  Mail,
  ShieldCheck,
  CheckCircle,
  Trash2,
  Calendar,
  Pencil,
  BarChart,
  UserCheck,
  Percent,
  Search,
  Lock,
  User,
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { user, changePassword } = useContext(AuthContext);

  // Lists State
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ stats_dict: {}, dept_stats: [], company_stats: [], student_count: 0 });
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // App loading & alerting states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [toast, setToast] = useState({ show: false, msg: '', error: false });

  // Modal target references
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Toggling modal states
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showDeleteJobModal, setShowDeleteJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form Field States
  // 1. Post/Edit Job
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  
  // 2. Schedule Interview
  const [interviewDate, setInterviewDate] = useState('');
  
  // 3. Admin password reset
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Sorting and Filtering States for Applications
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appSortField, setAppSortField] = useState('dateApplied');
  const [appSortDirection, setAppSortDirection] = useState('desc');

  const fetchDashboardData = async () => {
    try {
      const jobsRes = await API.get('/jobs');
      setJobs(jobsRes.data);

      const appsRes = await API.get('/applications/admin');
      setApplications(appsRes.data);

      const studentsRes = await API.get('/student/all');
      setStudents(studentsRes.data);

      const statsRes = await API.get('/applications/stats/admin');
      setStats(statsRes.data);

      const calRes = await API.get('/applications/calendar/admin');
      setCalendarEvents(calRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showToastMsg = (msg, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast({ show: false, msg: '', error: false }), 3000);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToastMsg('No student records to export.', true);
      return;
    }
    const headers = ['Full Name', 'Username', 'Email', 'Department', 'CGPA'];
    const rows = students.map((s) => [
      s.full_name || s.username,
      s.username,
      s.email,
      s.department || 'N/A',
      s.cgpa || 'N/A'
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'placement_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('CSV report downloaded successfully!');
  };

  // Job Actions
  const handleOpenEditJob = (job) => {
    setSelectedJob(job);
    setCompanyName(job.companyName);
    setPosition(job.position);
    setSalary(job.salary);
    setMinCgpa(job.minCgpa);
    setDeadline(new Date(job.deadline).toISOString().split('T')[0]);
    setDescription(job.description || '');
    setRequiredSkills(job.requiredSkills ? job.requiredSkills.join(', ') : '');
    setShowEditJobModal(true);
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      await API.post('/jobs', {
        companyName,
        position,
        salary,
        deadline,
        description,
        requiredSkills,
        minCgpa
      });
      showToastMsg('Job posted successfully!');
      setShowAddJobModal(false);
      resetJobForm();
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Error posting job', true);
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/jobs/${selectedJob._id}`, {
        companyName,
        position,
        salary,
        deadline,
        description,
        requiredSkills,
        minCgpa
      });
      showToastMsg('Job updated successfully!');
      setShowEditJobModal(false);
      resetJobForm();
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Error updating job', true);
    }
  };

  const handleDeleteJob = async () => {
    try {
      await API.delete(`/jobs/${selectedJob._id}`);
      showToastMsg('Job deleted successfully!');
      setShowDeleteJobModal(false);
      fetchDashboardData();
    } catch (err) {
      showToastMsg('Error deleting job', true);
    }
  };

  const resetJobForm = () => {
    setCompanyName('');
    setPosition('');
    setSalary('');
    setMinCgpa('');
    setDeadline('');
    setDescription('');
    setRequiredSkills('');
    setSelectedJob(null);
  };

  // Application Updates
  const handleUpdateStatus = async (appId, status) => {
    try {
      await API.put(`/applications/${appId}/status`, { status });
      showToastMsg(`Application status marked as ${status}!`);
      fetchDashboardData();
    } catch (err) {
      showToastMsg('Failed to update status', true);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/applications/${selectedApp._id}/schedule-interview`, {
        interview_date: interviewDate
      });
      showToastMsg('Interview scheduled successfully!');
      setShowInterviewModal(false);
      setInterviewDate('');
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Failed to schedule interview', true);
    }
  };

  const handleSendReminder = async (appId) => {
    try {
      showToastMsg('Sending interview reminder...');
      const { data } = await API.post(`/applications/${appId}/send-reminder`);
      showToastMsg(data.message || 'Reminder sent successfully!');
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Failed to send reminder', true);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    try {
      await API.post(`/student/delete-student/${selectedStudent.user_id}`);
      showToastMsg('Student account deleted.');
      setShowDeleteStudentModal(false);
      fetchDashboardData();
    } catch (err) {
      showToastMsg('Error deleting student account', true);
    }
  };

  // Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToastMsg('Passwords do not match.', true);
      return;
    }
    const res = await changePassword(currentPassword, newPassword, confirmPassword);
    if (res.success) {
      showToastMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } else {
      showToastMsg(res.message, true);
    }
  };

  // Chart Configuration Data
  const hasStatusData = Object.keys(stats.stats_dict || {}).length > 0;
  const statusLabels = Object.keys(stats.stats_dict || {}).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  const statusValues = Object.values(stats.stats_dict || {});

  const colorMap = {
    applied: '#3b82f6',
    interview: '#8b5cf6',
    offered: '#10b981',
    rejected: '#ef4444',
    saved: '#64748b'
  };

  const statusColors = Object.keys(stats.stats_dict || {}).map(
    (label) => colorMap[label.toLowerCase()] || '#6366f1'
  );

  const statusChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusColors,
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const deptChartData = {
    labels: (stats.dept_stats || []).map((d) => d.department || 'Unknown'),
    datasets: [
      {
        label: 'Students',
        data: (stats.dept_stats || []).map((d) => d.count),
        backgroundColor: '#6366f1',
        borderRadius: 5
      }
    ]
  };

  const companyChartData = {
    labels: (stats.company_stats || []).map((c) => c.company_name),
    datasets: [
      {
        label: 'Postings',
        data: (stats.company_stats || []).map((c) => c.count),
        backgroundColor: '#10b981',
        borderRadius: 5
      }
    ]
  };

  const handleHeaderClick = (field) => {
    if (appSortField === field) {
      setAppSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAppSortField(field);
      setAppSortDirection('asc');
    }
  };

  const filteredAndSortedApplications = React.useMemo(() => {
    // 1. Filter
    let result = applications.filter((app) => {
      const matchesSearch = 
        (app.fullName || '').toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        (app.companyName || '').toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        (app.position || '').toLowerCase().includes(appSearchQuery.toLowerCase());
      
      const matchesStatus = appStatusFilter === 'all' ? true : app.status === appStatusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    result.sort((a, b) => {
      let valA, valB;

      if (appSortField === 'candidate') {
        valA = (a.fullName || '').toLowerCase();
        valB = (b.fullName || '').toLowerCase();
      } else if (appSortField === 'matchScore') {
        valA = a.matchScore || 0;
        valB = b.matchScore || 0;
      } else if (appSortField === 'position') {
        valA = (a.position || '').toLowerCase();
        valB = (b.position || '').toLowerCase();
      } else if (appSortField === 'company') {
        valA = (a.companyName || '').toLowerCase();
        valB = (b.companyName || '').toLowerCase();
      } else if (appSortField === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      } else {
        // default: dateApplied
        valA = new Date(a.dateApplied || 0);
        valB = new Date(b.dateApplied || 0);
      }

      if (valA < valB) return appSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return appSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [applications, appSearchQuery, appStatusFilter, appSortField, appSortDirection]);

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`toast-msg ${toast.error ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Row Header */}
      <section className="flex-between mb-4 animate-fade-in" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Admin <span className="text-brand">Dashboard</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage posted opportunities and screen candidate pipelines.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary text-success btn-sm">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary btn-sm">
            <Lock size={16} /> Password
          </button>
          <Link to="/admin/bulk-actions" className="btn btn-secondary text-brand btn-sm">
            <Mail size={16} /> Bulk Actions
          </Link>
          <button onClick={() => { resetJobForm(); setShowAddJobModal(true); }} className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> Post New Job
          </button>
        </div>
      </section>

      {/* Tab controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`btn btn-sm ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Active Jobs
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`btn btn-sm ${activeTab === 'apps' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Manage Applications
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`btn btn-sm ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Student Registry
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn btn-sm ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`btn btn-sm ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Interview Calendar
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="text-center p-5">
          <div className="bold">Loading portal records...</div>
        </div>
      ) : (
        <div className="tab-body">
          {/* 1. Active Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="glass-card">
              <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Corporate Openings</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Position</th>
                      <th>Salary</th>
                      <th>Min CGPA</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job._id}>
                        <td className="bold">{job.companyName}</td>
                        <td>{job.position}</td>
                        <td>{job.salary}</td>
                        <td>
                          <span className="badge badge-secondary">{job.minCgpa}</span>
                        </td>
                        <td>{new Date(job.deadline).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleOpenEditJob(job)}
                            className="btn btn-outline-brand btn-sm"
                            style={{ marginRight: '0.5rem', padding: '0.35rem 0.75rem' }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => { setSelectedJob(job); setShowDeleteJobModal(true); }}
                            className="btn btn-secondary text-danger btn-sm"
                            style={{ padding: '0.35rem 0.75rem' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobs.length === 0 && (
                  <div className="text-center p-4 text-secondary">No jobs have been posted.</div>
                )}
              </div>
            </div>
          )}

          {/* 2. Manage Applications Tab */}
          {activeTab === 'apps' && (
            <div className="glass-card">
              <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Incoming Applications Queue</h3>
              
              {/* Filter and Sort Control Bar */}
              <div className="mb-4 animate-fade-in" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ position: 'relative', flex: '1 1 250px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by student, company, or role..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '2.75rem', borderRadius: '50px', fontSize: '0.9rem' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: '0 0 auto' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="form-control form-select"
                    style={{ width: '150px', borderRadius: '50px', fontSize: '0.85rem', padding: '0.5rem 2rem 0.5rem 1rem' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: '0 0 auto' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort By:</span>
                  <select
                    value={appSortField}
                    onChange={(e) => {
                      setAppSortField(e.target.value);
                      if (e.target.value === 'dateApplied') {
                        setAppSortDirection('desc');
                      } else {
                        setAppSortDirection('asc');
                      }
                    }}
                    className="form-control form-select"
                    style={{ width: '160px', borderRadius: '50px', fontSize: '0.85rem', padding: '0.5rem 2rem 0.5rem 1rem' }}
                  >
                    <option value="dateApplied">Date Applied</option>
                    <option value="company">Company Name</option>
                    <option value="position">Position / Role</option>
                    <option value="matchScore">Match Score</option>
                    <option value="status">Status</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => setAppSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="btn btn-secondary"
                    style={{ borderRadius: '50px', height: '38px', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                  >
                    {appSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    <span style={{ marginLeft: '0.25rem', fontWeight: 600 }}>{appSortDirection.toUpperCase()}</span>
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleHeaderClick('candidate')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Candidate 
                          {appSortField === 'candidate' ? (appSortDirection === 'asc' ? <ArrowUp size={14} className="text-brand" /> : <ArrowDown size={14} className="text-brand" />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleHeaderClick('matchScore')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Match Score 
                          {appSortField === 'matchScore' ? (appSortDirection === 'asc' ? <ArrowUp size={14} className="text-brand" /> : <ArrowDown size={14} className="text-brand" />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleHeaderClick('position')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Position 
                          {appSortField === 'position' ? (appSortDirection === 'asc' ? <ArrowUp size={14} className="text-brand" /> : <ArrowDown size={14} className="text-brand" />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleHeaderClick('company')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Company 
                          {appSortField === 'company' ? (appSortDirection === 'asc' ? <ArrowUp size={14} className="text-brand" /> : <ArrowDown size={14} className="text-brand" />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleHeaderClick('status')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Status 
                          {appSortField === 'status' ? (appSortDirection === 'asc' ? <ArrowUp size={14} className="text-brand" /> : <ArrowDown size={14} className="text-brand" />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
                        </div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedApplications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div className="bold">{app.fullName}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                            Applied: {new Date(app.dateApplied).toLocaleDateString()}
                          </div>
                          {app.resumeFilename ? (
                            <a
                              href={`http://localhost:5000/uploads/resumes/${app.resumeFilename}`}
                              target="_blank"
                              rel="noreferrer"
                              className="badge badge-primary"
                              style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '0.7rem' }}
                            >
                              View Resume
                            </a>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>No Resume</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '60px',
                              height: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${app.matchScore}%`,
                                height: '100%',
                                backgroundColor: app.matchScore >= 80 ? 'var(--color-success)' : app.matchScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                              }}></div>
                            </div>
                            <span className="bold" style={{
                              color: app.matchScore >= 80 ? 'var(--color-success)' : app.matchScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                              fontSize: '0.85rem'
                            }}>
                              {app.matchScore}%
                            </span>
                          </div>
                        </td>
                        <td>{app.position}</td>
                        <td>{app.companyName}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                            <span className={`badge ${
                              app.status === 'applied' ? 'badge-info' : 
                              app.status === 'interview' ? 'badge-primary' : 
                              app.status === 'offered' ? 'badge-success' : 
                              app.status === 'rejected' ? 'badge-danger' : 
                              'badge-secondary'
                            }`}>
                              {app.status}
                            </span>
                            {app.status === 'interview' && (
                              <span style={{ fontSize: '0.7rem', color: app.reminderSent ? 'var(--color-success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                                {app.reminderSent ? '🔔 Sent' : '🔕 No Reminder'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {app.status === 'interview' && (
                              <button
                                onClick={() => handleSendReminder(app._id)}
                                className={`btn btn-sm ${app.reminderSent ? 'btn-secondary text-success' : 'btn-outline-brand'}`}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                title={app.reminderSent ? "Resend Reminder" : "Send Interview Reminder"}
                              >
                                {app.reminderSent ? 'Resend' : 'Remind'}
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedApp(app); setShowInterviewModal(true); }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app._id, 'offered')}
                              className="btn btn-outline-brand btn-sm text-success"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: 'var(--color-success)' }}
                            >
                              Offer
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app._id, 'rejected')}
                              className="btn btn-secondary btn-sm text-danger"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAndSortedApplications.length === 0 && (
                  <div className="text-center p-4 text-secondary">
                    {applications.length === 0 ? "No applications filed yet." : "No applications match current search/filters."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Student Management Tab */}
          {activeTab === 'students' && (
            <div className="glass-card">
              <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Student Directory</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Department</th>
                      <th>CGPA</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="bold">{student.full_name || student.username}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{student.email}</div>
                        </td>
                        <td>{student.department || 'N/A'}</td>
                        <td>
                          <span className="badge badge-secondary">{student.cgpa || 'N/A'}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => { setSelectedStudent(student); setShowDeleteStudentModal(true); }}
                            className="btn btn-secondary text-danger btn-sm"
                            style={{ padding: '0.35rem 0.75rem' }}
                          >
                            <Trash2 size={12} /> Delete User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="text-center p-4 text-secondary">No students registered.</div>
                )}
              </div>
            </div>
          )}

          {/* 4. Statistics Charts Tab */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="dashboard-grid">
                {/* 1. Status Overview */}
                <div className="glass-card">
                  <h4 className="mb-3" style={{ fontSize: '1rem', fontWeight: 700 }}>Application Overview</h4>
                  <div style={{ height: '250px', position: 'relative' }}>
                    {hasStatusData ? (
                      <Doughnut data={statusChartData} options={{ maintainAspectRatio: false }} />
                    ) : (
                      <div className="text-center p-5 text-secondary">No status data to compile.</div>
                    )}
                  </div>
                </div>

                {/* 2. Department distribution */}
                <div className="glass-card">
                  <h4 className="mb-3" style={{ fontSize: '1rem', fontWeight: 700 }}>Department-wise Students</h4>
                  <div style={{ height: '250px', position: 'relative' }}>
                    {stats.dept_stats?.length > 0 ? (
                      <Bar data={deptChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    ) : (
                      <div className="text-center p-5 text-secondary">No department statistics.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Top Companies */}
              <div className="glass-card">
                <h4 className="mb-3" style={{ fontSize: '1rem', fontWeight: 700 }}>Top Hiring Companies (by Job Postings)</h4>
                <div style={{ height: '300px', position: 'relative' }}>
                  {stats.company_stats?.length > 0 ? (
                    <Bar
                      data={companyChartData}
                      options={{
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }}
                    />
                  ) : (
                    <div className="text-center p-5 text-secondary">No corporate statistics.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="glass-card">
              <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar className="text-brand" size={20} /> Recruitment Calendar (Interview Schedule)
              </h3>
              <div style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px' }}>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listMonth'
                  }}
                  events={calendarEvents}
                  eventDisplay="block"
                  eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                  }}
                  height="auto"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Post New Job</h3>
              <button onClick={() => setShowAddJobModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddJob}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Position *</label>
                <input type="text" className="form-control" value={position} onChange={(e) => setPosition(e.target.value)} required />
              </div>
              <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Salary *</label>
                  <input type="text" className="form-control" value={salary} onChange={(e) => setSalary(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min CGPA Required *</label>
                  <input type="number" step="0.01" className="form-control" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline Date *</label>
                <input type="date" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills (comma separated)</label>
                <input type="text" className="form-control" placeholder="e.g. Python, SQL, React" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddJobModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditJobModal && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Edit Job Posting</h3>
              <button onClick={() => setShowEditJobModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleEditJob}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Position *</label>
                <input type="text" className="form-control" value={position} onChange={(e) => setPosition(e.target.value)} required />
              </div>
              <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Salary *</label>
                  <input type="text" className="form-control" value={salary} onChange={(e) => setSalary(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min CGPA Required *</label>
                  <input type="number" step="0.01" className="form-control" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline Date *</label>
                <input type="date" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <input type="text" className="form-control" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditJobModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Job Confirmation */}
      {showDeleteJobModal && (
        <div className="modal-overlay">
          <div className="modal-content-box text-center animate-fade-in" style={{ maxWidth: '400px' }}>
            <AlertTriangle size={48} className="text-danger mb-3" style={{ margin: '0 auto' }} />
            <h3 className="bold" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Job Posting?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
              Are you sure you want to remove the posting for <strong>{selectedJob?.companyName}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteJobModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleDeleteJob} className="btn btn-danger btn-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Schedule Interview</h3>
              <button onClick={() => setShowInterviewModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleScheduleInterview}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Assign an interview slot for <strong>{selectedApp?.fullName}</strong> applying for <strong>{selectedApp?.position}</strong> at <strong>{selectedApp?.companyName}</strong>.
              </p>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowInterviewModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Schedule Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {showDeleteStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content-box text-center animate-fade-in" style={{ maxWidth: '400px' }}>
            <AlertTriangle size={48} className="text-danger mb-3" style={{ margin: '0 auto' }} />
            <h3 className="bold" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Student User?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
              Permanently purge student profile data and applications for <strong>{selectedStudent?.full_name || selectedStudent?.username}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteStudentModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleDeleteStudent} className="btn btn-danger btn-sm">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content-box animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Update Admin Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
