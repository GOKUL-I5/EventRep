import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUser, FiShare2, FiBookmark, FiCalendar as FiAddCalendar, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function EventHero({ event, isBookmarked, onToggleBookmark }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Live Countdown Hook
  useEffect(() => {
    if (!event?.date) return;
    
    const calculateTimeLeft = () => {
      // Parse event date and time
      const targetString = `${event.date} ${event.time?.replace(/AM|PM/i, '') || '09:00'}`;
      const difference = +new Date(targetString) - +new Date();
      
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [event?.date, event?.time]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Event link copied to clipboard!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCalendarLink = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(event.location || event.venue || "");
    const dateStr = event.date?.split('-').join('') || '';
    const startTimeStr = dateStr + 'T090000Z';
    const endTimeStr = dateStr + 'T180000Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeStr}/${endTimeStr}&details=${details}&location=${location}`;
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '480px',
      borderRadius: '24px',
      overflow: 'hidden',
      marginBottom: '3rem',
      background: '#0a0f1d',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
    }}>
      {/* Cover Image & Parallax Tint */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `url(${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}) center/cover no-repeat`,
        filter: 'brightness(0.65) contrast(1.05)',
        zIndex: 0
      }} />

      {/* Luxury Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to bottom, rgba(10,15,29,0.3) 0%, rgba(10,15,29,0.95) 100%)',
        zIndex: 1
      }} />

      {/* Hero Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        minHeight: '480px',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: '2rem'
      }}>
        {/* Top Badges and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Status & Category */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{
              background: `linear-gradient(135deg, ${event.status === 'live' ? '#10b981, #059669' : '#6366f1, #4f46e5'})`,
              color: '#ffffff',
              padding: '0.35rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
            }}>
              {event.status || 'Upcoming'}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
              padding: '0.35rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {event.category?.replace('_', ' ') || 'Special Event'}
            </span>
          </div>

          {/* Quick Floating Action Icons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handleShare}
              title="Share Event"
              className="glass-button"
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc',
                cursor: 'pointer', transition: 'all 0.3s ease'
              }}
            >
              <FiShare2 size={18} />
            </button>
            <button 
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isBookmarked ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: isBookmarked ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: isBookmarked ? '0 4px 12px rgba(245,158,11,0.3)' : 'none'
              }}
            >
              <FiBookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <a 
              href={getCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              title="Add to Google Calendar"
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc',
                cursor: 'pointer', transition: 'all 0.3s ease'
              }}
            >
              <FiAddCalendar size={18} />
            </a>
          </div>
        </div>

        {/* Title & Headline details */}
        <div>
          <h1 style={{
            fontSize: 'calc(2.5rem + 1vw)',
            fontWeight: '800',
            color: '#ffffff',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {event.title}
          </h1>

          {/* Quick Metrics (Date, Location, Host) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            color: '#e2e8f0',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FiCalendar size={18} style={{ color: '#818cf8' }} />
              <span>{event.date} @ {event.time || 'Not Specified'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FiMapPin size={18} style={{ color: '#818cf8' }} />
              <span>{event.venue || event.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FiUser size={18} style={{ color: '#818cf8' }} />
              <span>Host: {event.organizerName || 'Verified Host'}</span>
            </div>
          </div>
        </div>

        {/* Live Countdown Ribbon (Only when active and date is in future) */}
        {timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '1rem 2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.5rem',
            alignSelf: 'flex-start',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
              <FiClock size={18} className="pulse-icon" />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starts In</span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', color: '#ffffff', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc' }}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginTop: '0.1rem' }}>Days</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginTop: '0.1rem' }}>Hrs</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginTop: '0.1rem' }}>Mins</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f59e0b' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginTop: '0.1rem' }}>Secs</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
