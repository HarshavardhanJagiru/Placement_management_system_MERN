import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import API from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please provide your email.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      setSuccess(data.message || 'OTP reset code sent!');
      sessionStorage.setItem('resetEmail', email);
      setTimeout(() => {
        navigate('/reset-password');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Forgot Password?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Enter your account email to receive a recovery code
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
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="student@univ.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Sending Code...' : <><Mail size={16} /> Send Reset Link</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ fontWeight: 600 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
