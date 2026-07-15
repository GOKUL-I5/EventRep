import React, { useState } from 'react';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';

export default function FAQ() {
  const faqData = [
    { q: 'Is vehicle parking available at the venue?', a: 'Yes! Free onsite parking is available for all ticket holders. Standard spaces are allocated on a first-come, first-served basis, and dedicated VIP parking blocks are reserved near the main lobby entrance.' },
    { q: 'Can I request a ticket cancellation and refund?', a: 'Cancellations made at least 48 hours prior to the event start time are eligible for a full refund. You can cancel your pass directly from the ticket card dashboard or contact support for help.' },
    { q: 'Are there age restrictions or entry guidelines?', a: 'This event is open to participants of all ages. However, children under 12 must be accompanied by an adult, and valid photo ID verification may be checked at the check-in gates.' }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
        <FiHelpCircle style={{ color: '#818cf8' }} /> Frequently Asked Questions
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {faqData.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx}
              style={{
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Question Trigger */}
              <div 
                onClick={() => toggleOpen(idx)}
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#cbd5e1' }}>{item.q}</span>
                <FiChevronDown 
                  size={18} 
                  style={{ 
                    color: '#818cf8', 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} 
                />
              </div>

              {/* Answer Pane */}
              {isOpen && (
                <div style={{
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                  borderTop: '1px solid rgba(255,255,255,0.02)'
                }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
