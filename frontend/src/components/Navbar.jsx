import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { Bell, LogOut, User, LayoutDashboard, Kanban, GraduationCap } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    if (user && user.role === 'student') {
      try {
        const { data } = await API.get('/notifications/unread-count');
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count', error);
      }
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 30 seconds if student is logged in
    let interval;
    if (user && user.role === 'student') {
      interval = setInterval(fetchUnreadCount, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <GraduationCap size={28} style={{ strokeWidth: 2.5 }} />
          <span>PlacementSys</span>
        </Link>
        <ul className="navbar-links">
          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <li>
                    <NavLink
                      to="/student/dashboard"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/student/kanban"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Kanban size={16} /> Kanban Board
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/student/profile"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <User size={16} /> Profile
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/student/notifications"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-10px',
                            background: '#ef4444',
                            color: '#fff',
                            borderRadius: '50px',
                            padding: '2px 6px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                </>
              )}

              {user.role === 'admin' && (
                <li>
                  <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <LayoutDashboard size={16} /> Admin Panel
                  </NavLink>
                </li>
              )}

              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '50px' }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className="btn btn-primary btn-sm">
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
