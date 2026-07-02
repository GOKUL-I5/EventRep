import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBell, FiMoon, FiSun, FiUser, FiCheckCircle, FiInfo, FiAlertCircle, FiMenu } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TopNav = ({ toggleSidebar }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { userData, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header style={{
      height: '80px',
      padding: '0 2rem',
      backgroundColor: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <FiMenu size={24} />
        </button>
        {/* Search Bar */}
        <div className="topnav-search" style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.1)', borderRadius: '24px', padding: '0.5rem 1rem', width: '300px' }}>
          <FiSearch size={20} color="var(--color-text-secondary)" />
          <input 
            type="text" 
            placeholder="Search events, users..." 
            style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', color: 'var(--color-text-primary)', width: '100%' }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
        </button>
        
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowDropdown(false); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', position: 'relative', display: 'flex' }}>
            <FiBell size={22} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, width: '18px', height: '18px', backgroundColor: 'var(--color-danger)', color: '#fff', fontSize: '0.65rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute', top: '150%', right: -10, width: '350px', maxHeight: '400px', overflowY: 'auto',
                  backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)',
                  borderRadius: '16px', boxShadow: 'var(--shadow-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>Mark all read</button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: '2rem 0', fontSize: '0.875rem' }}>You're all caught up!</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if(!n.read) markAsRead(n.id);
                          if(n.link) {
                            navigate(n.link);
                            setShowNotifDropdown(false);
                          }
                        }}
                        style={{ 
                          padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.75rem',
                          background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                          border: n.read ? '1px solid transparent' : '1px solid var(--color-glass-border)'
                        }}
                      >
                        <div style={{ color: n.type === 'success' ? 'var(--color-success)' : n.type === 'alert' ? 'var(--color-danger)' : 'var(--color-accent)', marginTop: '0.2rem' }}>
                          {n.type === 'success' ? <FiCheckCircle /> : n.type === 'alert' ? <FiAlertCircle /> : <FiInfo />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: n.read ? '500' : '600', fontSize: '0.875rem' }}>{n.title}</p>
                          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>{n.message}</p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifDropdown(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: userData?.photoURL ? `url(${userData.photoURL}) center/cover` : 'var(--color-accent)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff'
            }}>
              {!userData?.photoURL && (userData?.firstName?.charAt(0) || <FiUser />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{userData?.firstName || 'User'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{userData?.role || 'User'}</span>
            </div>
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '200px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-glass-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <button onClick={() => { setShowDropdown(false); navigate('/profile'); }} style={dropdownBtnStyle}>Profile</button>
                <button style={dropdownBtnStyle}>Settings</button>
                <div style={{ height: '1px', background: 'var(--color-glass-border)', margin: '0.5rem 0' }} />
                <button onClick={handleLogout} style={{ ...dropdownBtnStyle, color: 'var(--color-danger)' }}>Log out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const dropdownBtnStyle = {
  background: 'none',
  border: 'none',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'background 0.2s',
  fontSize: '0.875rem'
};

export default TopNav;
