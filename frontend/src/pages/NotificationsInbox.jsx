import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, BellRing, MailOpen, Calendar } from 'lucide-react';
import API from '../services/api';

const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all your notifications? This cannot be undone.')) {
      try {
        await API.delete('/notifications/clear');
        setNotifications([]);
        setMessage('All notifications have been cleared.');
      } catch (error) {
        console.error('Error clearing notifications', error);
      }
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(notifications.filter((notif) => notif._id !== id));
      setMessage('Notification deleted.');
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  // Render icons dynamically
  const getIcon = (msg) => {
    if (msg.includes('Offer')) return <MailOpen size={20} className="text-success" />;
    if (msg.includes('Interview')) return <Calendar size={20} className="text-brand" />;
    if (msg.includes('Rejected')) return <AlertCircle size={20} className="text-danger" />;
    return <BellRing size={20} className="text-brand" />;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Notification <span className="text-brand">Inbox</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track updates on your applications</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={handleClearAll} className="btn btn-secondary btn-sm text-danger">
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {message && (
        <div className="badge badge-success mb-3" style={{
          width: '100%', padding: '0.75rem', textTransform: 'none', letterSpacing: 'normal', justifyContent: 'flex-start'
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center p-5">
          <div className="bold">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card text-center p-5">
          <BellRing size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No notifications yet</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We'll alert you here when application statuses update.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.map((notif) => (
            <div key={notif._id} className="notif-item">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  {getIcon(notif.message)}
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.25rem' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteOne(notif._id)} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsInbox;
