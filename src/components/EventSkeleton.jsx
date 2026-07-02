import React from 'react';
import { motion } from 'framer-motion';

const EventSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ width: '200px', height: '100%', minHeight: '150px', background: 'var(--color-glass-border)', borderRadius: '12px' }} className="skeleton-pulse" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '24px', width: '60%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ height: '16px', width: '40%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ height: '16px', width: '30%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '24px', width: '80px', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
            <div style={{ height: '36px', width: '120px', background: 'var(--color-glass-border)', borderRadius: '8px' }} className="skeleton-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: '180px', width: '100%', background: 'var(--color-glass-border)' }} className="skeleton-pulse" />
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
        <div style={{ height: '24px', width: '80%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
        <div style={{ height: '16px', width: '60%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
        <div style={{ height: '16px', width: '50%', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
          <div style={{ height: '24px', width: '60px', background: 'var(--color-glass-border)', borderRadius: '4px' }} className="skeleton-pulse" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: 'var(--color-glass-border)' }} className="skeleton-pulse" />
            <div style={{ height: '36px', width: '80px', borderRadius: '8px', background: 'var(--color-glass-border)' }} className="skeleton-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSkeleton;
