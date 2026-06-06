import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim() || !fullName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ chars, have 1 uppercase, 1 number, and 1 special symbol.');
      return;
    }

    setLoadingSubmit(true);
    const res = await register(
      username,
      email,
      password,
      fullName,
      department,
      cgpa
    );
    setLoadingSubmit(false);

    if (res.success && res.pendingUserId) {
      sessionStorage.setItem('pendingUserId', res.pendingUserId);
      navigate('/verify-email');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join the university recruitment ecosystem</p>
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
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-control"
                placeholder="harsha123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="student@univ.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Min 8 chars, 1 uppercase, 1 number, 1 special key.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Harshavardhan Jagiru"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 8.5"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem', marginTop: '1rem' }} disabled={loadingSubmit}>
            {loadingSubmit ? 'Registering...' : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
