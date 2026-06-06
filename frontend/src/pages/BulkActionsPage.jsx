import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Mail, Search, CheckSquare, Square, Filter, ChevronLeft, AlertCircle, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const BulkActionsPage = () => {
  // Filters State
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('all');
  const [cgpaFilter, setCgpaFilter] = useState(0.0);
  
  // Recipients State
  const [recipients, setRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Compose message details
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Status Alert States
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', error: false });
  const [showComposeModal, setShowComposeModal] = useState(false);

  const fetchInitialData = async () => {
    try {
      // Fetch all students to initialize list
      const studentsRes = await API.get('/student/all');
      
      // Map students list to match expected recipient details
      const list = studentsRes.data.map((s) => ({
        id: s.user_id, // User accounts ID (sent to bulk-email)
        full_name: s.full_name,
        username: s.username,
        email: s.email,
        department: s.department,
        cgpa: s.cgpa
      }));
      setRecipients(list);

      // Deduplicate departments
      const depts = [...new Set(studentsRes.data.map((s) => s.department).filter(Boolean))];
      setDepartments(depts);
    } catch (err) {
      console.error('Error fetching bulk actions data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToastMsg = (msg, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast({ show: false, msg: '', error: false }), 4000);
  };

  const handleApplyFilters = async () => {
    setFiltering(true);
    try {
      const { data } = await API.post('/student/filter', {
        department: deptFilter,
        min_cgpa: cgpaFilter
      });
      setRecipients(data);
      setSelectedIds([]); // Reset checklist selections
      showToastMsg(`Filters applied! Found ${data.length} students.`);
    } catch (err) {
      showToastMsg('Failed to apply filters', true);
    } finally {
      setFiltering(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(recipients.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApplyTemplate = (type) => {
    if (type === 'job') {
      setSubject('New Job Opportunity Relevant to Your Profile');
      setBody(
        "Hello,\n\nA new job posting that matches your department and skills has just been added to the portal. Please log in and review the vacancy under 'Active Jobs'.\n\nBest regards,\nPlacement Cell"
      );
    } else if (type === 'reminder') {
      setSubject('Action Required: Complete Your Placement Profile');
      setBody(
        "Dear Student,\n\nWe noticed that your profile is incomplete. Having a complete profile and an uploaded resume is mandatory for applying to job openings.\n\nPlease update your profile as soon as possible.\n\nPlacement Cell"
      );
    }
  };

  const handleSendMessages = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      showToastMsg('Please select at least one recipient student.', true);
      return;
    }
    if (!subject.trim() || !body.trim()) {
      showToastMsg('Subject and body details are required.', true);
      return;
    }

    setSending(true);
    try {
      const { data } = await API.post('/applications/bulk-email', {
        studentIds: selectedIds,
        subject,
        body
      });
      showToastMsg(data.message || 'Bulk emails dispatched!');
      setShowComposeModal(false);
      // Clear message content
      setSubject('');
      setBody('');
      setSelectedIds([]);
    } catch (err) {
      showToastMsg(err.response?.data?.message || 'Failed to dispatch bulk emails', true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-msg ${toast.error ? 'error' : ''}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Row Breadcrumb Header */}
      <section className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <ChevronLeft size={14} />
          <Link to="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>Back to Dashboard</Link>
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Bulk <span className="text-brand">Messaging</span></h2>
        <p style={{ color: 'var(--text-secondary)' }}>Filter target students and send customized placement email notices.</p>
      </section>

      {loading ? (
        <div className="text-center p-5">
          <div className="bold">Loading filter options...</div>
        </div>
      ) : (
        <div className="admin-grid" style={{ gridTemplateColumns: '300px 1fr' }}>
          {/* Filters card */}
          <div className="glass-card" style={{ height: 'fit-content', padding: '1.5rem' }}>
            <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="text-brand" size={16} /> Filters
            </h3>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-control form-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'between' }}>
                <span>Min CGPA:</span> <span className="bold text-brand" style={{ marginLeft: 'auto' }}>{cgpaFilter}</span>
              </label>
              <input
                type="range"
                className="form-control"
                min="0"
                max="10"
                step="0.1"
                value={cgpaFilter}
                onChange={(e) => setCgpaFilter(parseFloat(e.target.value))}
                style={{ padding: 0, height: '6px' }}
              />
            </div>

            <button onClick={handleApplyFilters} className="btn btn-primary w-100 btn-sm" disabled={filtering}>
              {filtering ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>

          {/* Table list */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="flex-between mb-4">
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Recipients List ({selectedIds.length} Selected)
              </h4>
              <button
                onClick={() => setShowComposeModal(true)}
                className="btn btn-outline-brand btn-sm"
                disabled={selectedIds.length === 0}
              >
                <Mail size={14} /> Compose Message
              </button>
            </div>

            <div className="table-wrapper" style={{ maxHeight: '500px' }}>
              <table className="table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={recipients.length > 0 && selectedIds.length === recipients.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>Student</th>
                    <th>Department</th>
                    <th>CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => handleToggleOne(r.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div className="bold">{r.full_name || r.username}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.email}</div>
                      </td>
                      <td>{r.department || 'N/A'}</td>
                      <td>
                        <span className="badge badge-secondary">{r.cgpa || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recipients.length === 0 && (
                <div className="text-center p-4 text-secondary">No students match current filters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="modal-overlay">
          <div className="modal-content-box animate-fade-in" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Compose Bulk Message</h3>
              <button onClick={() => setShowComposeModal(false)} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleSendMessages}>
              <div className="badge badge-info mb-3" style={{ width: '100%', padding: '0.5rem', textTransform: 'none', letterSpacing: 'normal' }}>
                This message will be dispatched to <strong>{selectedIds.length}</strong> selected candidate emails.
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Recruitment Drive Update"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Message Body *</label>
                <textarea
                  className="form-control"
                  rows={8}
                  placeholder="Draft your email contents..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Apply Quick Templates:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleApplyTemplate('job')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                    Job Alert Alert
                  </button>
                  <button type="button" onClick={() => handleApplyTemplate('reminder')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                    Incomplete Profile Reminder
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowComposeModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
                  {sending ? 'Dispatching...' : <><Mail size={14} /> Send Emails</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsPage;
