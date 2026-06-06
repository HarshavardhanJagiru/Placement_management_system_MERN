import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { Search, Briefcase, Calendar, PieChart, Sparkles, Ban, FileCheck, CheckCircle2 } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [stats, setStats] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', error: false });

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch all jobs
      const jobsRes = await API.get('/jobs');
      setJobs(jobsRes.data);

      // 2. Fetch applications to know what has been applied/saved
      const appsRes = await API.get('/applications/student');
      const appsMapping = {};
      appsRes.data.forEach((app) => {
        appsMapping[app.jobId?._id || app.jobId] = app.status;
      });
      setAppliedJobs(appsMapping);

      // 3. Fetch personal statistics for Chart
      const statsRes = await API.get('/applications/stats/student');
      setStats(statsRes.data.stats_dict || {});

      // 4. Fetch personal calendar events
      const calRes = await API.get('/applications/calendar/student');
      setCalendarEvents(calRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data', error);
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

  const handleApply = async (jobId) => {
    try {
      const { data } = await API.post(`/applications/apply/${jobId}`);
      showToastMsg(data.message || 'Application submitted!');
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Apply failed.', true);
    }
  };

  const handleSave = async (jobId) => {
    try {
      const { data } = await API.post(`/applications/save/${jobId}`);
      showToastMsg(data.message || 'Job saved!');
      fetchDashboardData();
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Save failed.', true);
    }
  };

  // Filter jobs by search query
  const filteredJobs = jobs.filter((job) => {
    const term = searchQuery.toLowerCase();
    return (
      job.position.toLowerCase().includes(term) ||
      job.companyName.toLowerCase().includes(term)
    );
  });

  // Chart Setup
  const hasApplications = Object.keys(stats).length > 0;
  const chartLabels = Object.keys(stats).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  const chartValues = Object.values(stats);

  const colorMap = {
    saved: '#64748b',
    applied: '#3b82f6',
    in_progress: '#f59e0b',
    interview: '#8b5cf6',
    offered: '#10b981',
    rejected: '#ef4444'
  };

  const chartColors = Object.keys(stats).map(
    (label) => colorMap[label.toLowerCase()] || '#6366f1'
  );

  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: chartColors,
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          font: { size: 11, family: 'Inter' }
        }
      }
    }
  };

  const studentCgpa = user?.studentDetails?.cgpa || 0.0;

  return (
    <div className="animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-msg ${toast.error ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Hero Header */}
      <section className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '3rem' }}>
        <div className="glass-card flex-between" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
              <Sparkles size={12} style={{ marginRight: '4px' }} /> Candidate Hub
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Welcome Back, <span className="text-brand">{user?.studentDetails?.fullName || user?.username}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Discover active job postings, match your credentials, and build your recruitment pipeline.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/student/profile" className="btn btn-secondary">
              Edit Profile
            </Link>
            <Link to="/student/kanban" className="btn btn-primary">
              My Applications
            </Link>
          </div>
        </div>

        {/* Mini Chart Insights */}
        <div className="glass-card text-center" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Application Insights
          </h4>
          {hasApplications ? (
            <div style={{ height: '150px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '1rem' }}>
              <PieChart size={32} className="text-muted" style={{ margin: '0 auto 0.5rem auto', opacity: 0.2 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                No applications yet. <br /> Apply or Save jobs to see insights.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Calendar Section */}
      <section className="mb-4">
        <div className="glass-card">
          <h3 className="mb-3" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar className="text-brand" size={20} /> My Interview Schedule
          </h3>
          <div style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px' }}>
            <FullCalendar
              plugins={[dayGridPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listMonth'
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
      </section>

      {/* Job Search Section */}
      <section className="mb-4">
        <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search className="text-muted" size={20} />
          <input
            type="text"
            className="form-control"
            placeholder="Search active roles by company or job title..."
            style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Jobs Listings Container */}
      {loading ? (
        <div className="text-center p-5">
          <div className="bold">Loading active opportunities...</div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card text-center p-5">
          <Briefcase size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No opportunities found</h4>
          <p style={{ color: 'var(--text-secondary)' }}>Check back later or adjust your search.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {filteredJobs.map((job) => {
            const trackingStatus = appliedJobs[job._id];
            const isEligible = studentCgpa >= job.minCgpa;

            return (
              <div key={job._id} className="glass-card interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>HOT JOB</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{job.position}</h4>
                  <p className="text-brand bold" style={{ fontSize: '0.95rem' }}>{job.companyName}</p>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', marginBottom: '1.25rem' }} />
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <p>💰 <strong style={{ color: 'var(--text-primary)' }}>Salary:</strong> {job.salary}</p>
                  <p>⏳ <strong style={{ color: 'var(--text-primary)' }}>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
                  <p>
                    🎓 <strong style={{ color: 'var(--text-primary)' }}>Min CGPA:</strong>{' '}
                    <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                      {job.minCgpa}
                    </span>
                  </p>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem', flexGrow: 1 }}>
                  {job.description ? `${job.description.substring(0, 120)}...` : 'No description provided.'}
                </p>

                {trackingStatus ? (
                  trackingStatus === 'saved' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {isEligible ? (
                        <button onClick={() => handleApply(job._id)} className="btn btn-primary w-100 btn-sm">
                          Apply Now
                        </button>
                      ) : (
                        <div className="badge badge-danger text-center" style={{ padding: '0.5rem', textTransform: 'none', letterSpacing: 'normal' }}>
                          <Ban size={14} style={{ marginRight: '4px' }} /> Ineligible (CGPA too low)
                        </div>
                      )}
                      <button className="btn btn-secondary w-100 btn-sm" disabled>
                        <FileCheck size={14} /> Saved to Board
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-success w-100 btn-sm" style={{ cursor: 'default' }} disabled>
                      <CheckCircle2 size={14} /> Tracking in Kanban
                    </button>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                    {isEligible ? (
                      <>
                        <button onClick={() => handleApply(job._id)} className="btn btn-primary w-100 btn-sm">
                          Apply Now
                        </button>
                        <button onClick={() => handleSave(job._id)} className="btn btn-secondary w-100 btn-sm">
                          Save to Board
                        </button>
                      </>
                    ) : (
                      <div className="badge badge-danger text-center" style={{ padding: '0.75rem', textTransform: 'none', letterSpacing: 'normal', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Ban size={20} />
                        <span className="bold">Ineligible for Role</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Requires minimum {job.minCgpa} CGPA</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
