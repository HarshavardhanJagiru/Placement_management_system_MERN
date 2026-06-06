import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Kanban, Sparkles, CheckCircle, ShieldAlert, Lock, Building, Calendar, Trophy } from 'lucide-react';

const StudentKanban = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', error: false });
  const [draggedApp, setDraggedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      const { data } = await API.get('/applications/student');
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToastMsg = (msg, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast({ show: false, msg: '', error: false }), 3000);
  };

  const columns = [
    { id: 'saved', title: 'Need to Apply', colorClass: 'col-saved' },
    { id: 'applied', title: 'Applied', colorClass: 'col-applied' },
    { id: 'in_progress', title: 'In Progress', colorClass: 'col-in_progress' },
    { id: 'interview', title: 'Interview', colorClass: 'col-interview' },
    { id: 'offered', title: 'Offer Received', colorClass: 'col-offered' },
    { id: 'rejected', title: 'Rejected', colorClass: 'col-rejected' }
  ];

  // Drag and Drop Handlers
  const handleDragStart = (e, app) => {
    // If offered or rejected (locked), prevent dragging
    if (['offered', 'rejected'].includes(app.status)) {
      e.preventDefault();
      return;
    }
    setDraggedApp(app);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedApp) return;

    const originalStatus = draggedApp.status;
    if (originalStatus === targetStatus) {
      setDraggedApp(null);
      return;
    }

    // Update state locally for optimistic response
    const updatedApps = applications.map((app) => {
      if (app._id === draggedApp._id) {
        return { ...app, status: targetStatus };
      }
      return app;
    });
    setApplications(updatedApps);

    try {
      const { data } = await API.post('/applications/update-status-ajax', {
        app_id: draggedApp._id,
        new_status: targetStatus
      });

      if (data.success) {
        showToastMsg(`Moved to ${targetStatus.replace('_', ' ').toUpperCase()}!`);
      }
    } catch (error) {
      // Revert if API fails (e.g., locked status)
      const revertedApps = applications.map((app) => {
        if (app._id === draggedApp._id) {
          return { ...app, status: originalStatus };
        }
        return app;
      });
      setApplications(revertedApps);
      
      const errorMsg = error.response?.status === 403 
        ? 'This application has been finalized by the admin and cannot be moved.'
        : 'Failed to update application status.';
      showToastMsg(errorMsg, true);
    } finally {
      setDraggedApp(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-msg ${toast.error ? 'error' : ''}`}>
          {toast.error ? <ShieldAlert size={16} /> : <CheckCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <section className="text-center mb-4">
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Kanban className="text-brand" size={28} /> Application <span className="text-brand">Tracker</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Drag and drop jobs across columns to track your recruitment progress.
        </p>
      </section>

      {loading ? (
        <div className="text-center p-5">
          <div className="bold">Loading applications board...</div>
        </div>
      ) : (
        <div className="kanban-container">
          {columns.map((col) => {
            const colApps = applications.filter((app) => app.status === col.id);

            return (
              <div
                key={col.id}
                className={`kanban-column ${col.colorClass}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kanban-column-header">
                  <span>{col.title}</span>
                  <span className="badge badge-secondary">{colApps.length}</span>
                </div>

                <div className="kanban-card-list">
                  {colApps.map((app) => {
                    const isLocked = ['offered', 'rejected'].includes(app.status);

                    return (
                      <div
                        key={app._id}
                        className={`kanban-card ${isLocked ? 'locked' : ''}`}
                        draggable={!isLocked}
                        onDragStart={(e) => handleDragStart(e, app)}
                      >
                        {isLocked && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--text-muted)' }}>
                            <Lock size={12} />
                          </div>
                        )}
                        <h6 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', paddingRight: isLocked ? '15px' : '0' }}>
                          {app.jobId?.position || 'Job Profile'}
                        </h6>
                        <p className="text-brand bold" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          <Building size={12} /> {app.jobId?.companyName || 'Corporate'}
                        </p>
                        
                        {app.status === 'offered' && (
                          <div className="badge badge-success" style={{ width: '100%', padding: '4px 8px', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'center' }}>
                            <Trophy size={12} style={{ marginRight: '4px' }} /> Offer Received!
                          </div>
                        )}

                        {app.status === 'rejected' && (
                          <div className="badge badge-danger" style={{ width: '100%', padding: '4px 8px', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'center' }}>
                            Application Closed
                          </div>
                        )}

                        {app.status === 'interview' && app.interviewDate && (
                          <div className="badge badge-primary" style={{ width: '100%', padding: '4px 8px', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'center' }}>
                            <Calendar size={12} style={{ marginRight: '4px' }} /> {new Date(app.interviewDate).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </div>
                        )}

                        {!isLocked && app.status !== 'interview' && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Applied: {new Date(app.dateApplied).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentKanban;
