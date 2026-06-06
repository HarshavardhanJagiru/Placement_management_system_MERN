import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, CheckCircle } from 'lucide-react';

const VerifyEmailPage = () => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const { verifyEmail } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const pendingUserId = sessionStorage.getItem('pendingUserId');

  useEffect(() => {
    if (!pendingUserId) {
      navigate('/login');
    }
  }, [pendingUserId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP verification code.');
      return;
    }

    setLoadingSubmit(true);
    const res = await verifyEmail(pendingUserId, otpCode);
    setLoadingSubmit(false);

    if (res.success) {
      setSuccessMsg('Email verified successfully! Opening your dashboard...');
      sessionStorage.removeItem('pendingUserId');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Verify Your Email</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          We sent a 6-digit verification code to your email address. Please enter it below.
        </p>

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
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="badge badge-success" style={{ 
            width: '100%', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--border-radius-sm)', 
            marginBottom: '1.5rem',
            textTransform: 'none',
            letterSpacing: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // only allow digits
              style={{
                fontSize: '1.8rem',
                textAlign: 'center',
                letterSpacing: '0.3em',
                fontWeight: 'bold',
                padding: '0.5rem 0'
              }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem' }} disabled={loadingSubmit}>
            {loadingSubmit ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
