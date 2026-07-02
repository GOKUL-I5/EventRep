import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { FiHome, FiCalendar, FiUsers, FiSettings, FiMenu, FiX, FiActivity, FiSearch, FiCheckSquare, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const { userData } = useAuth();

  const baseNavItems = [
    { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { name: 'Explore', icon: FiSearch, path: '/explore' },
    { name: 'My Tickets', icon: FiCheckSquare, path: '/tickets' },
    { name: 'My Events', icon: FiCalendar, path: '/events/manage' },
    { name: 'Attendees', icon: FiUsers, path: '/attendees' },
    { name: 'Analytics', icon: FiActivity, path: '/analytics' },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', icon: FiShield, path: '/admin/dashboard' },
    { name: 'Manage Users', icon: FiUsers, path: '/admin/users' },
    { name: 'Global Events', icon: FiActivity, path: '/admin/events' },
    { name: 'System Settings', icon: FiSettings, path: '/admin/settings' },
  ];

  const navItems = userData?.role === 'admin' 
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  const sidebarVariants = {
    open: { width: '260px', x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: isMobile ? '260px' : '80px', x: isMobile ? '-100%' : 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  return (
    <motion.div 
      variants={sidebarVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      style={{
        height: '100%',
        backgroundColor: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-glass-border)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: 50,
        boxShadow: isMobile && isOpen ? 'var(--shadow-lg)' : 'none'
      }}
    >
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', height: '80px' }}>
        {(isOpen || isMobile) && <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-accent)' }}>EventX</h2>}
        {!isMobile && (
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        )}
        {isMobile && (
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              textDecoration: 'none',
              borderRight: isActive ? '4px solid var(--color-accent)' : '4px solid transparent',
              transition: 'background 0.2s'
            })}
          >
            <item.icon size={24} style={{ minWidth: '24px' }} />
            <AnimatePresence>
              {(isOpen || isMobile) && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{ marginLeft: '1rem', whiteSpace: 'nowrap', fontWeight: '500' }}
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;
