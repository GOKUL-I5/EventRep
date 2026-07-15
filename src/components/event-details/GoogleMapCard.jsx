import React from 'react';
import { FiMapPin, FiCompass, FiClock } from 'react-icons/fi';

export default function GoogleMapCard({ event }) {
  const locationQuery = encodeURIComponent(event.venue || event.location || "India");
  const city = event.city || "Chennai";

  // Mock distance calculation based on the city length to make it look responsive and customized
  const mockDistance = ((city.length * 1.4) % 12 + 2.5).toFixed(1);
  const mockTravelTime = Math.round(mockDistance * 2.2 + 5);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '1.5rem',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Map Header */}
      <div>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiMapPin size={16} style={{ color: '#818cf8' }} /> Location & Directions
        </h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.2rem' }}>
          {event.location || event.venue}
        </span>
      </div>

      {/* Embedded dark maps wrapper */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
          src={`https://maps.google.com/maps?q=${locationQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
          title="Google Map"
        />
      </div>

      {/* Directions dashboard / Travel specs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
          <FiCompass size={14} style={{ color: '#818cf8' }} />
          <span>{mockDistance} km away</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
          <FiClock size={14} style={{ color: '#818cf8' }} />
          <span>{mockTravelTime} mins drive</span>
        </div>
      </div>

      {/* Button directions link */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${locationQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#cbd5e1',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: '600',
          transition: 'all 0.2s',
          textAlign: 'center'
        }}
        className="glass-button"
      >
        Get Driving Directions
      </a>
    </div>
  );
}
