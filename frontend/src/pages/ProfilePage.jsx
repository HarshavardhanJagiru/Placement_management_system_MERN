import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, ShieldAlert, CheckCircle, FileText, Lock, Trash2, KeyRound } from 'lucide-react';
import API from '../services/api';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useContext(AuthContext);
  
  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  
  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status Alert States
  const [profileAlert, setProfileAlert] = useState({ show: false, msg: '', error: false });
  const [passwordAlert, setPasswordAlert] = useState({ show: false, msg: '', error: false });
  
  // Modal togglers
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user && user.studentDetails) {
      setFullName(user.studentDetails.fullName || '');
      setDepartment(user.studentDetails.department || '');
      setCgpa(user.studentDetails.cgpa || '');
      setSkills(user.studentDetails.skills ? user.studentDetails.skills.join(', ') : '');
    }
  }, [user]);

  const showProfileAlert = (msg, error = false) => {
    setProfileAlert({ show: true, msg, error });
    setTimeout(() => setProfileAlert({ show: false, msg: '', error: false }), 4000);
  };

  const showPasswordAlert = (msg, error = false) => {
    setPasswordAlert({ show: true, msg, error });
    setTimeout(() => setPasswordAlert({ show: false, msg: '', error: false }), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim() || !department.trim() || !cgpa) {
      showProfileAlert('Please fill in all required fields.', true);
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('department', department);
    formData.append('cgpa', cgpa);
    formData.append('skills', skills);
    if (resumeFile) {
      formData.append('resume_file', resumeFile);
    }

    const res = await updateProfile(formData);
    if (res.success) {
      showProfileAlert('Profile updated successfully!');
      setResumeFile(null); // Reset file selection
    } else {
      showProfileAlert(res.message, true);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (newPassword !== confirmPassword) {
      showPasswordAlert('New passwords do not match!', true);
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      showPasswordAlert('Requirements not met: 8+ chars, 1 uppercase, 1 number, 1 special character.', true);
      return;
    }

    const res = await changePassword(currentPassword, newPassword, confirmPassword);
    if (res.success) {
      showPasswordAlert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } else {
      showPasswordAlert(res.message, true);
    }
  };

  const handleDeleteAccount = async () => {
    const res = await deleteAccount();
    if (!res.success) {
      showProfileAlert(res.message, true);
      setShowDeleteModal(false);
    }
  };

  const resumeUrl = user?.studentDetails?.resumeFilename
    ? `http://localhost:5000/uploads/resumes/${user.studentDetails.resumeFilename}`
    : null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card">
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User className="text-brand" size={28} /> Professional <span className="text-brand">Profile</span>
        </h2>

        {profileAlert.show && (
          <div className={`badge ${profileAlert.error ? 'badge-danger' : 'badge-success'} mb-3`} style={{
            width: '100%', padding: '0.75rem 1rem', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'flex-start'
          }}>
            {profileAlert.error ? <ShieldAlert size={16} style={{ marginRight: '4px' }} /> : <CheckCircle size={16} style={{ marginRight: '4px' }} />}
            <span>{profileAlert.msg}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <input
                type="text"
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">CGPA *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Upload Resume (PDF / DOCX)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.docx"
                onChange={(e) => setResumeFile(e.target.files[0])}
              />
              {resumeUrl && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={14} className="text-brand" />
                  <a href={resumeUrl} target="_blank" rel="noreferrer" className="bold">View Uploaded Resume</a>
                </div>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Skills (comma separated)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. React, Node.js, Python, AWS"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Add skills separated by commas to increase match scores against corporate requirements.
            </small>
          </div>

          <button type="submit" className="btn btn-primary px-5">
            Update Profile
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '3rem 0' }} />

        {/* Security Settings */}
        <section className="mb-4">
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound className="text-brand" size={18} /> Security <span className="text-brand">Settings</span>
          </h4>
          <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary">
            Change Password
          </button>
        </section>

        {/* Danger Zone */}
        <div style={{
          border: '1px solid var(--color-danger)',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1.5rem',
          marginTop: '3rem'
        }}>
          <h4 className="text-danger bold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Danger Zone</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Deleting your account will purge all personal data, resume records, and active job applications permanently.
          </p>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger btn-sm">
            Delete My Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content-box animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} className="text-brand" /> Change Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="close-btn">&times;</button>
            </div>
            
            {passwordAlert.show && (
              <div className={`badge ${passwordAlert.error ? 'badge-danger' : 'badge-success'} mb-3`} style={{
                width: '100%', padding: '0.75rem', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'flex-start'
              }}>
                {passwordAlert.error ? <ShieldAlert size={14} style={{ marginRight: '4px' }} /> : <CheckCircle size={14} style={{ marginRight: '4px' }} />}
                <span>{passwordAlert.msg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  At least 8 chars, 1 uppercase, 1 number, and 1 special symbol.
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content-box text-center animate-fade-in" style={{ maxWidth: '400px' }}>
            <Trash2 size={48} className="text-danger mb-3" style={{ margin: '0 auto' }} />
            <h3 className="text-danger bold" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Delete Account?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Are you sure? This will remove all files and records. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} className="btn btn-danger btn-sm">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
