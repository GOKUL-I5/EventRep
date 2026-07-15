import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiUsers, FiLock, FiCheck, FiDownload, FiPrinter, FiHeart, FiBookOpen } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import { downloadPDFTicket } from '../../utils/pdfGenerator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function TicketCard({ 
  event, 
  user, 
  ticket, 
  isRegistered, 
  loadingRegister, 
  onRegister, 
  onCancelTicket,
  isBookmarked,
  onToggleBookmark
}) {
  const [selectedTier, setSelectedTier] = useState(0);

  // Parse custom ticket types or fallback to standard pricing
  const tiers = event.ticketTypes || [
    { type: 'General Admission', price: event.price || 0 }
  ];

  const currentTier = tiers[selectedTier] || tiers[0];
  const isFree = currentTier.price === 0;

  // Seats calculation
  const totalCapacity = event.capacity || 100;
  const availableSeats = event.availableSeats !== undefined ? event.availableSeats : totalCapacity;
  const fillPercentage = ((totalCapacity - availableSeats) / totalCapacity) * 100;

  // Dynamic PDF ticket builder
  const handleDownloadPDF = async () => {
    if (!ticket) return;
    try {
      const canvas = document.getElementById('ticket-qr-canvas');
      const qrCodeDataUrl = canvas ? canvas.toDataURL('image/jpeg') : null;

      let bookingDetails = {
        bookingId: ticket.bookingId || ticket.id,
        attendeeName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest',
        attendeeEmail: user?.email || '',
        attendeePhone: user?.mobileNumber || '',
        attendeeAddress: user?.address || 'N/A',
        quantity: 1,
        ticketType: currentTier.type,
        amount: currentTier.price
      };

      if (ticket.bookingId) {
        try {
          const bookingDoc = await getDoc(doc(db, "bookings", ticket.bookingId));
          if (bookingDoc.exists()) {
            const data = bookingDoc.data();
            bookingDetails = {
              bookingId: ticket.bookingId,
              attendeeName: data.attendeeName || bookingDetails.attendeeName,
              attendeeEmail: data.attendeeEmail || bookingDetails.attendeeEmail,
              attendeePhone: data.attendeePhone || bookingDetails.attendeePhone,
              attendeeAddress: data.attendeeAddress || bookingDetails.attendeeAddress,
              quantity: data.quantity || 1,
              ticketType: data.ticketType || bookingDetails.ticketType,
              amount: data.amount !== undefined ? data.amount : bookingDetails.amount
            };
          }
        } catch (err) {
          console.warn("Failed to fetch booking details for ticket PDF, using fallbacks:", err);
        }
      }

      await downloadPDFTicket(event, bookingDetails, qrCodeDataUrl);
      toast.success("PDF Pass downloaded!");
    } catch (error) {
      console.error("PDF generation error: ", error);
      toast.error("Failed to generate PDF pass");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '2rem',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Visual Ambient Glow inside Ticket */}
      <div style={{
        position: 'absolute',
        top: '-50px', right: '-50px',
        width: '150px', height: '150px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Pricing */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Admission Ticket</span>
          <span style={{
            background: isFree ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
            color: isFree ? '#10b981' : '#818cf8',
            border: `1px solid ${isFree ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {isFree ? 'Free Pass' : 'Paid Entry'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
          <span style={{
            fontSize: '3rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {isFree ? 'Free' : `₹${currentTier.price}`}
          </span>
          {!isFree && <span style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: '500' }}>/ seat</span>}
        </div>
      </div>

      {/* Ticket Tier Selection */}
      {tiers.length > 1 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontWeight: '500' }}>Select Pass Tier</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tiers.map((t, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedTier(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: selectedTier === idx ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedTier === idx ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Left accent bar */}
                {selectedTier === idx && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px',
                    backgroundColor: '#818cf8', borderRadius: '0 4px 4px 0'
                  }} />
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: selectedTier === idx ? '#f8fafc' : '#cbd5e1' }}>
                  {t.type}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedTier === idx ? '#818cf8' : '#94a3b8' }}>
                  {t.price === 0 ? 'Free' : `₹${t.price}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Seats Tracker */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Availability Status</span>
          <span style={{ color: availableSeats <= 10 ? '#ef4444' : '#cbd5e1', fontWeight: '600' }}>
            {availableSeats === 0 ? 'Sold Out' : `${availableSeats} seats remaining`}
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, 100 - fillPercentage))}%`,
            height: '100%',
            background: availableSeats <= 10 ? 'linear-gradient(90deg, #ef4444, #b91c1c)' : 'linear-gradient(90deg, #6366f1, #a855f7)',
            borderRadius: '10px',
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>

      {/* Action Buttons */}
      {!isRegistered ? (
        <button
          onClick={() => onRegister(currentTier.price)}
          disabled={loadingRegister || availableSeats === 0}
          className="gradient-button"
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '16px',
            background: availableSeats === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
            border: 'none',
            color: availableSeats === 0 ? 'var(--color-text-secondary)' : '#ffffff',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: availableSeats === 0 ? 'not-allowed' : 'pointer',
            boxShadow: availableSeats === 0 ? 'none' : '0 10px 25px -5px rgba(99,102,241,0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          {loadingRegister ? 'Securing Seat...' : availableSeats === 0 ? 'Sold Out' : isFree ? 'Register Free' : `Book Ticket (₹${currentTier.price})`}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.85rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '16px',
            color: '#10b981',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            <FiCheck /> You are Registered
          </div>
          <button
            onClick={onCancelTicket}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
          >
            Cancel Registration
          </button>
        </div>
      )}

      {/* Ticket Pass Display (QR Ticket Stub Layout) */}
      {isRegistered && ticket && (
        <div style={{
          marginTop: '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--color-glass-border)',
          borderRadius: '20px',
          padding: '1.5rem',
          position: 'relative'
        }}>
          {/* Half-circles cutout details */}
          <div style={{
            position: 'absolute', top: '50%', left: '-12px', transform: 'translateY(-50%)',
            width: '24px', height: '24px', borderRadius: '50%', background: '#0a0f1d', borderRight: '1px dashed var(--color-glass-border)'
          }} />
          <div style={{
            position: 'absolute', top: '50%', right: '-12px', transform: 'translateY(-50%)',
            width: '24px', height: '24px', borderRadius: '50%', background: '#0a0f1d', borderLeft: '1px dashed var(--color-glass-border)'
          }} />

          {/* Ticket Body */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
            <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              <QRCodeCanvas id="ticket-qr-canvas" value={ticket.qrCodeData || `ticket:${ticket.id}`} size={110} />
            </div>
            
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Your Entry Pass</span>
              <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.75rem', color: '#818cf8', marginTop: '0.2rem', fontWeight: '600' }}>
                ID: {ticket.id?.substring(0, 14).toUpperCase()}
              </span>
            </div>

            {/* Print & Download buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.65rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1',
                  fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <FiDownload size={14} /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.65rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1',
                  fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <FiPrinter size={14} /> Print Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorite & Quick Info Footer */}
      <div style={{
        marginTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={onToggleBookmark}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', border: 'none', color: isBookmarked ? '#f59e0b' : 'var(--color-text-secondary)',
            fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer'
          }}
        >
          <FiHeart fill={isBookmarked ? 'currentColor' : 'none'} />
          <span>{isBookmarked ? 'Saved to Favorites' : 'Save to Favorites'}</span>
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Secured Booking</span>
      </div>
    </div>
  );
}
