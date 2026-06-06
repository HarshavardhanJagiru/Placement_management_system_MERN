import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoadingSubmit(true);
    const res = await login(username, password);
    setLoadingSubmit(false);

    if (res.success) {
      if (res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      if (res.notVerified && res.pendingUserId) {
        // Redirect to email verification page with pending user ID
        sessionStorage.setItem('pendingUserId', res.pendingUserId);
        navigate('/verify-email');
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to continue to Placement Portal</p>
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
            gap: '0.5rem',
            justifyContent: 'flex-start'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem' }} disabled={loadingSubmit}>
            {loadingSubmit ? 'Signing In...' : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
