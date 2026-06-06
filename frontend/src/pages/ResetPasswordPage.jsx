import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import API from '../services/api';

const ResetPasswordPage = () => {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const resetEmail = sessionStorage.getItem('resetEmail');

  useEffect(() => {
    if (!resetEmail) {
      navigate('/forgot-password');
    }
  }, [resetEmail, navigate]);

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setError('Password must be 8+ chars, have 1 uppercase, 1 number, and 1 special symbol.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/reset-password', {
        email: resetEmail,
        otpCode,
        newPassword,
        confirmPassword
      });
      
      setSuccess(data.message || 'Password reset successfully!');
      sessionStorage.removeItem('resetEmail');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Verification code sent to <strong>{resetEmail}</strong>
          </p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ 
            width: '100%', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--border-radius-sm)', 
            marginBottom: '1.5rem',
            textTransform: 'none',
            letterSpacing: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="badge badge-success" style={{ 
            width: '100%', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--border-radius-sm)', 
            marginBottom: '1.5rem',
            textTransform: 'none',
            letterSpacing: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">OTP Verification Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Min 8 chars, 1 uppercase, 1 number, 1 special key.
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Resetting Password...' : <><ShieldCheck size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
