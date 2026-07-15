import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiCheckCircle, FiUsers, FiAward } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function OrganizerCard({ event }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(1280);

  const handleFollowToggle = () => {
    setIsFollowing(prev => !prev);
    setFollowerCount(prev => prev + (isFollowing ? -1 : 1));
    toast.success(isFollowing ? "Unfollowed organizer" : "Following organizer!");
  };

  // Safe fallbacks for seeder mock metadata
  const organizerName = event.organizerName || "Premium Event Host";
  const organizerEmail = event.organizerEmail || "support@eventx.com";
  const organizerPhone = event.organizerPhone || "+91 98765 43210";

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '2rem',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
      position: 'relative'
    }}>
      {/* Visual Header / Avatar Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '68px', height: '68px',
            borderRadius: '50%',
            border: '2px solid #818cf8',
            padding: '2px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)'
          }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              background: `url(https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150) center/cover`
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: '#f59e0b', color: '#000000',
            width: '20px', height: '20px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0f172a', fontSize: '0.65rem'
          }}>
            ★
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
              {organizerName}
            </h3>
            <FiCheckCircle size={15} style={{ color: '#f59e0b' }} title="Verified Organizer" />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.1rem' }}>
            Official Event Partner
          </span>
        </div>
      </div>

      {/* Stats Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events</span>
          <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.2rem' }}>14 Created</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</span>
          <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#818cf8', marginTop: '0.2rem' }}>
            {followerCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={handleFollowToggle}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '12px',
          background: isFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
          border: isFollowing ? '1px solid rgba(255,255,255,0.1)' : 'none',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '1.5rem',
          boxShadow: isFollowing ? 'none' : '0 4px 12px rgba(99,102,241,0.2)'
        }}
      >
        {isFollowing ? 'Following' : 'Follow Organizer'}
      </button>

      {/* Contact Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a 
          href={`mailto:${organizerEmail}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            color: '#cbd5e1', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s'
          }}
        >
          <FiMail size={16} style={{ color: '#818cf8' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{organizerEmail}</span>
        </a>
        <a 
          href={`tel:${organizerPhone}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            color: '#cbd5e1', fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s'
          }}
        >
          <FiPhone size={16} style={{ color: '#818cf8' }} />
          <span>{organizerPhone}</span>
        </a>
      </div>

      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
        fontWeight: '500'
      }}>
        Member since Jan 2024
      </div>
    </div>
  );
}
