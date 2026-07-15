import React from 'react';
import { FiClock, FiCalendar } from 'react-icons/fi';

export default function EventTimeline({ event }) {
  // Safe schedule fallback if none specified in document
  const timelineData = event.schedule || [
    { time: '09:00 AM', title: 'Welcome Drinks & Registration', description: 'Check-in, grab your badge, and network with early attendees over coffee.' },
    { time: '10:15 AM', title: 'Opening Keynote Panel', description: 'Opening speech by organizers outlining the core event objectives and highlights.' },
    { time: '11:30 AM', title: 'Expert Breakout Sessions', description: 'Interactive discussions and tech talks led by industry veterans.' },
    { time: '01:00 PM', title: 'Catered Networking Lunch', description: 'A gourmet lunch break designed to encourage discussion and connect with peers.' },
    { time: '03:30 PM', title: 'Closing Notes & Networking', description: 'Awards distribution, Q&A sessions, and final concluding speech.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <FiCalendar style={{ color: '#818cf8' }} /> Event Schedule & Agenda
      </h3>

      <div style={{ position: 'relative', paddingLeft: '1.75rem', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
        {timelineData.map((item, index) => (
          <div 
            key={index}
            style={{
              position: 'relative',
              marginBottom: index === timelineData.length - 1 ? 0 : '2rem'
            }}
          >
            {/* Timeline Bullet Indicator */}
            <div style={{
              position: 'absolute',
              left: 'calc(-1.75rem - 6px)',
              top: '4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: index === 0 ? '#10b981' : '#6366f1',
              boxShadow: index === 0 ? '0 0 8px #10b981' : '0 0 8px #6366f1',
              zIndex: 1
            }} />

            {/* Time Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(99,102,241,0.08)',
              color: '#818cf8',
              padding: '0.2rem 0.6rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              border: '1px solid rgba(99,102,241,0.15)'
            }}>
              <FiClock size={12} />
              <span>{item.time}</span>
            </div>

            {/* Title & Description */}
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#cbd5e1' }}>
              {item.title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
