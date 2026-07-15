import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiCalendar } from 'react-icons/fi';

export default function RecommendationCarousel({ events, currentEventId, category }) {
  const navigate = useNavigate();

  // Filter out the current event and find matching categories
  const recommended = events
    .filter(ev => ev.id !== currentEventId && ev.status === 'approved' && ev.category === category)
    .slice(0, 4);

  // If we don't have enough category matches, backfill with general approved events
  if (recommended.length < 3) {
    const general = events
      .filter(ev => ev.id !== currentEventId && ev.status === 'approved' && ev.category !== category)
      .slice(0, 4 - recommended.length);
    recommended.push(...general);
  }

  if (recommended.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
          Recommended Events
        </h3>
        <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          See All <FiArrowRight size={14} />
        </span>
      </div>

      {/* Horizontal Scroller */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none' // IE/Edge
      }} className="hide-scrollbar">
        {recommended.map((ev) => (
          <div
            key={ev.id}
            onClick={() => navigate(`/events/${ev.id}`)}
            style={{
              flex: '0 0 280px',
              height: '240px',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 10px 25px -10px rgba(0,0,0,0.5)',
              background: '#0e1726',
              transition: 'all 0.3s ease'
            }}
            className="premium-rec-card"
          >
            {/* Card Cover Background */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: `url(${ev.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}) center/cover no-repeat`,
              transition: 'transform 0.5s ease',
              filter: 'brightness(0.7)'
            }} className="rec-image" />

            {/* Gradient overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(10,15,29,0.95) 100%)',
              zIndex: 1
            }} />

            {/* Card Content */}
            <div style={{
              position: 'relative', zIndex: 2,
              height: '100%', padding: '1.25rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              gap: '0.4rem'
            }}>
              {/* Category */}
              <span style={{
                alignSelf: 'flex-start',
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc',
                padding: '0.15rem 0.5rem',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {ev.category?.replace('_', ' ')}
              </span>

              {/* Title */}
              <h4 style={{
                margin: '0.2rem 0',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {ev.title}
              </h4>

              {/* Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FiCalendar size={12} />
                  <span>{ev.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FiMapPin size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.city || ev.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
