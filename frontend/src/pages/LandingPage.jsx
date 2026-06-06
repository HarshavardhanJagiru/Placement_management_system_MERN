import React, { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, ShieldCheck, BarChart3, Mail } from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '5rem', padding: '3rem 0' }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #1e293b 40%, var(--color-brand) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Bridging the Gap Between <br />
          <span style={{ color: 'var(--color-brand)' }}>Recruiters</span> and <span style={{ color: 'var(--color-purple)' }}>Candidates</span>
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.2rem',
          maxWidth: '650px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6
        }}>
          University Placement Hub is a modern, high-aesthetic Applicant Tracking System (ATS) automating recruitment pipelines, tracking applications, and sending email updates.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link to="/register" className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ marginBottom: '5rem' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '3rem'
        }}>
          Features Engineered for <span style={{ color: 'var(--color-brand)' }}>Success</span>
        </h2>
        
        <div className="dashboard-grid">
          <div className="glass-card">
            <div style={{
              background: 'var(--color-brand-glow)',
              color: 'var(--color-brand)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Automated Kanban Board</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Students can drag and drop jobs natively through tracking columns: Saved, Applied, In Progress, Interview, Offered, and Rejected.
            </p>
          </div>

          <div className="glass-card">
            <div style={{
              background: 'var(--color-purple-glow)',
              color: 'var(--color-purple)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Real-time Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Admins get immediate charts on placements, department summaries, and top corporate recruiters. Students get circular success breakdowns.
            </p>
          </div>

          <div className="glass-card">
            <div style={{
              background: 'var(--color-info-glow)',
              color: 'var(--color-info)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Mail size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Smart Reminders</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Instant verification codes, schedule notifications, custom bulk mail updates, and 24-hour background email alerts for upcoming interviews.
            </p>
          </div >

          <div className="glass-card">
            <div style={{
              background: 'var(--color-success-glow)',
              color: 'var(--color-success)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>ATS Eligibility Checks</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Criteria screening blocks students below minimum CGPA limits and rates applications automatically using skill keyword match scores.
            </p>
          </div >
        </div >
      </section >
    </div >
  );
};

export default LandingPage;
