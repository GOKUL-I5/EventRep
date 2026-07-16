import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiGlobe, FiLinkedin } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadPDFTicket } from '../../utils/pdfGenerator';

export default function BookingForm({ event, user, loading, onSubmit, onClose }) {
  const [step, setStep] = useState('details'); // 'details', 'payment', 'success'
  const [bookingResult, setBookingResult] = useState(null); // stores { bookingId, qrCodeData }

  const [attendeeName, setAttendeeName] = useState(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
  const [attendeeEmail, setAttendeeEmail] = useState(user ? user.email || '' : '');
  const [attendeePhone, setAttendeePhone] = useState(user ? user.mobileNumber || '' : '');
  const [attendeeAddress, setAttendeeAddress] = useState('');
  const [attendeeLinkedin, setAttendeeLinkedin] = useState(user ? user.linkedin || '' : '');
  
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'wallet'
  
  // Payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('gpay');

  // Form errors
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  // Tiers and pricing
  const tiers = event.ticketTypes || [{ type: 'General Admission', price: event.price || 0 }];
  const currentTier = tiers[selectedTierIndex] || tiers[0];
  const isPaid = currentTier.price > 0;
  const totalAmount = currentTier.price * quantity;

  // Determine if the event is workshop/learning purpose
  const isWorkshop = useMemo(() => {
    const learningKeywords = ['workshop', 'bootcamp', 'conference', 'meetup', 'hackathon', 'symposium', 'summit', 'marketing', 'learning', 'course', 'training', 'seminar'];
    const category = (event.category || '').toLowerCase();
    const title = (event.title || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    
    return learningKeywords.some(keyword => 
      category.includes(keyword) || title.includes(keyword) || desc.includes(keyword)
    );
  }, [event]);

  const validateDetails = () => {
    const errs = {};
    if (!attendeeName.trim()) errs.name = 'Full Name is required';
    if (!attendeeEmail.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(attendeeEmail)) {
      errs.email = 'Enter a valid email address';
    }
    if (!attendeePhone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (attendeePhone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!attendeeAddress.trim()) errs.address = 'Address is required';

    if (isWorkshop && attendeeLinkedin.trim()) {
      if (!/^(https?:\/\/)?(www\.)?linkedin\.com\/.+$/i.test(attendeeLinkedin.trim())) {
        errs.linkedin = 'Enter a valid LinkedIn URL (e.g. linkedin.com/in/username)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePayment = () => {
    const errs = {};
    if (isPaid) {
      if (paymentMethod === 'card') {
        if (!cardNumber.trim()) errs.cardNumber = 'Card number is required';
        if (!cardExpiry.trim()) errs.cardExpiry = 'Expiry MM/YY is required';
        if (!cardCvv.trim()) errs.cardCvv = 'CVV is required';
      } else if (paymentMethod === 'upi') {
        if (!upiId.trim() || !upiId.includes('@')) errs.upiId = 'Enter a valid UPI ID (e.g. name@upi)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextOrSubmit = async (e) => {
    e.preventDefault();
    if (step === 'details') {
      if (!validateDetails()) return;
      if (isPaid) {
        setStep('payment');
      } else {
        await triggerBookingSubmit('free');
      }
    } else if (step === 'payment') {
      if (!validatePayment()) return;
      await triggerBookingSubmit(paymentMethod);
    }
  };

  const triggerBookingSubmit = async (method) => {
    setProcessing(true);
    try {
      // Simulate transaction validation for 1.2 seconds for slick user experience
      await new Promise(resolve => setTimeout(resolve, 1200));

      const details = {
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim(),
        attendeePhone: attendeePhone.trim(),
        attendeeAddress: attendeeAddress.trim(),
        attendeeLinkedin: isWorkshop ? attendeeLinkedin.trim() : '',
        ticketType: currentTier.type,
        quantity,
        amount: totalAmount,
        paymentMethod: method
      };

      const result = await onSubmit(details);
      if (result) {
        setBookingResult(result);
        setStep('success');
      }
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (step === 'success' && bookingResult && !isPaid) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, bookingResult, isPaid]);

  const handleDownloadPDF = async () => {
    if (!bookingResult) return;
    try {
      const canvas = document.getElementById('checkout-qr-canvas');
      const qrCodeDataUrl = canvas ? canvas.toDataURL('image/jpeg') : null;
      
      const pdfBookingDetails = {
        bookingId: bookingResult.bookingId,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim(),
        attendeePhone: attendeePhone.trim(),
        attendeeAddress: attendeeAddress.trim(),
        attendeeLinkedin: isWorkshop ? attendeeLinkedin.trim() : '',
        quantity,
        ticketType: currentTier.type,
        amount: totalAmount
      };

      await downloadPDFTicket(event, pdfBookingDetails, qrCodeDataUrl);
    } catch (pdfErr) {
      console.error("Failed to generate PDF pass:", pdfErr);
    }
  };

  const renderStepper = () => {
    const showPaymentStep = isPaid;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0.5rem 1rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        gap: '0.75rem', width: '100%'
      }}>
        {/* Step 1: Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: step === 'details' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#10b981',
            color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: step === 'details' ? '0 0 12px rgba(99,102,241,0.5)' : 'none'
          }}>
            {step === 'details' ? '1' : '✓'}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: step === 'details' ? '#ffffff' : 'var(--color-text-secondary)' }}>Details</span>
        </div>

        {/* Divider 1 */}
        <div style={{ flex: 1, height: '2px', background: step !== 'details' ? 'linear-gradient(90deg, #10b981, #6366f1)' : 'rgba(255,255,255,0.08)', minWidth: '20px' }} />

        {/* Step 2: Payment */}
        {showPaymentStep && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: step === 'payment' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : (step === 'success' ? '#10b981' : 'rgba(255,255,255,0.08)'),
                color: step === 'payment' || step === 'success' ? '#fff' : 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: step === 'payment' ? '0 0 12px rgba(99,102,241,0.5)' : 'none'
              }}>
                {step === 'success' ? '✓' : '2'}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: step === 'payment' ? '#ffffff' : 'var(--color-text-secondary)' }}>Payment</span>
            </div>
            {/* Divider 2 */}
            <div style={{ flex: 1, height: '2px', background: step === 'success' ? 'linear-gradient(90deg, #10b981, #6366f1)' : 'rgba(255,255,255,0.08)', minWidth: '20px' }} />
          </>
        )}

        {/* Step 3: Ticket */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: step === 'success' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.08)',
            color: step === 'success' ? '#fff' : 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: step === 'success' ? '0 0 12px rgba(99,102,241,0.5)' : 'none'
          }}>
            {showPaymentStep ? '3' : '2'}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: step === 'success' ? '#ffffff' : 'var(--color-text-secondary)' }}>Ticket</span>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.08)', border: '2px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#10b981', fontSize: '1.5rem'
        }}>
          ✓
        </div>
        
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', fontWeight: '800', color: '#ffffff' }}>Pass Secured Successfully!</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '380px', lineHeight: '1.4' }}>
            We've generated your entry ticket with a unique QR code. Press below to download your visual PDF entry pass.
          </p>
        </div>

        {/* Perforated ticket visual layout */}
        <div style={{
          width: '100%', maxWidth: '320px',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '-11px', transform: 'translateY(-50%)', width: '22px', height: '22px', borderRadius: '50%', background: '#05070f', borderRight: '1px dashed rgba(255,255,255,0.12)' }} />
          <div style={{ position: 'absolute', top: '50%', right: '-11px', transform: 'translateY(-50%)', width: '22px', height: '22px', borderRadius: '50%', background: '#05070f', borderLeft: '1px dashed rgba(255,255,255,0.12)' }} />

          <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
            {bookingResult && (
              <QRCodeCanvas id="checkout-qr-canvas" value={bookingResult.qrCodeData} size={130} />
            )}
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff', fontWeight: '600' }}>Attendee: {attendeeName}</span>
            <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.75rem', color: '#818cf8', marginTop: '0.25rem', fontWeight: '600' }}>
              PASS ID: {bookingResult?.bookingId?.substring(0, 16).toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
          <button
            type="button" onClick={handleDownloadPDF}
            className="gradient-button"
            style={{
              flex: 1, padding: '1rem', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
              color: '#ffffff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(99,102,241,0.3)', transition: 'all 0.2s'
            }}
          >
            Download PDF Ticket
          </button>
          <button
            type="button" onClick={onClose}
            style={{
              padding: '1rem 1.5rem', borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#cbd5e1', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '1rem', overflowY: 'auto'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        style={{
          width: '100%', maxWidth: '620px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          overflow: 'hidden', position: 'relative'
        }}
      >
        {/* Top Header Row */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>Event Checkout</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{event.title}</span>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent', border: 'none', color: '#cbd5e1',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Stepper display */}
        <div style={{ padding: '1rem 2rem 0 2rem' }}>
          {renderStepper()}
        </div>

        <div style={{ padding: '2rem' }}>
          <AnimatePresence mode="wait">
            {step === 'details' && (
              <motion.form 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNextOrSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {/* Ticket Specs (Tier, Qty) */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  padding: '1.25rem', borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Select Pass Tier</label>
                    <select 
                      value={selectedTierIndex} 
                      onChange={(e) => setSelectedTierIndex(Number(e.target.value))}
                      style={{
                        background: '#0e1726', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', color: '#ffffff', padding: '0.5rem', outline: 'none', fontSize: '0.9rem'
                      }}
                    >
                      {tiers.map((t, idx) => (
                        <option key={idx} value={idx}>{t.type} - {t.price === 0 ? 'Free' : `₹${t.price}`}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Quantity</label>
                    <select 
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      style={{
                        background: '#0e1726', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', color: '#ffffff', padding: '0.5rem', outline: 'none', fontSize: '0.9rem'
                      }}
                    >
                      {[1, 2, 3, 4, 5].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Attendee details inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendee Details</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="sm-two-column-inputs">
                    {/* Full Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.02)', border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                        padding: '0.75rem 1rem', borderRadius: '12px'
                      }}>
                        <FiUser style={{ color: '#818cf8' }} />
                        <input 
                          type="text" placeholder="Full Name" value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                      </div>
                      {errors.name && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.name}</span>}
                    </div>

                    {/* Email Address */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.02)', border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                        padding: '0.75rem 1rem', borderRadius: '12px'
                      }}>
                        <FiMail style={{ color: '#818cf8' }} />
                        <input 
                          type="email" placeholder="Email Address" value={attendeeEmail} onChange={(e) => setAttendeeEmail(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                      </div>
                      {errors.email && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.email}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="sm-two-column-inputs">
                    {/* Phone Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.02)', border: errors.phone ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                        padding: '0.75rem 1rem', borderRadius: '12px'
                      }}>
                        <FiPhone style={{ color: '#818cf8' }} />
                        <input 
                          type="tel" placeholder="Mobile Number" value={attendeePhone} onChange={(e) => setAttendeePhone(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                      </div>
                      {errors.phone && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.phone}</span>}
                    </div>

                    {/* Physical Address */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.02)', border: errors.address ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                        padding: '0.75rem 1rem', borderRadius: '12px'
                      }}>
                        <FiMapPin style={{ color: '#818cf8' }} />
                        <input 
                          type="text" placeholder="Attendee Address" value={attendeeAddress} onChange={(e) => setAttendeeAddress(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                      </div>
                      {errors.address && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.address}</span>}
                    </div>
                  </div>

                  {/* Conditional LinkedIn field for workshop / learning events */}
                  {isWorkshop && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Workshop Registration Details</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.02)', border: errors.linkedin ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                        padding: '0.75rem 1rem', borderRadius: '12px'
                      }}>
                        <FiLinkedin style={{ color: '#0077b5' }} />
                        <input 
                          type="url" placeholder="LinkedIn Profile URL (optional)" value={attendeeLinkedin} onChange={(e) => setAttendeeLinkedin(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                        />
                      </div>
                      {errors.linkedin && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.linkedin}</span>}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="gradient-button"
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
                    color: '#ffffff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(99,102,241,0.4)', transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem'
                  }}
                >
                  {processing ? 'Processing...' : isPaid ? 'Continue to Payment' : 'Claim Free Ticket'}
                </button>
              </motion.form>
            )}

            {step === 'payment' && (
              <motion.form 
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNextOrSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</h4>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>Total: ₹{totalAmount}</span>
                  </div>

                  {/* Payment Gateway Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {['card', 'upi', 'wallet'].map(method => (
                      <button
                        key={method} type="button" onClick={() => setPaymentMethod(method)}
                        style={{
                          padding: '0.65rem 0.5rem', borderRadius: '10px',
                          background: paymentMethod === method ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${paymentMethod === method ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                          color: paymentMethod === method ? '#818cf8' : '#cbd5e1',
                          fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase'
                        }}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {/* Selected Form Wrapper */}
                  <div style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
                    padding: '1.25rem', borderRadius: '16px'
                  }}>
                    {paymentMethod === 'card' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          background: '#0a0f1a', border: errors.cardNumber ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                          padding: '0.65rem 0.85rem', borderRadius: '10px'
                        }}>
                          <FiCreditCard style={{ color: '#94a3b8' }} />
                          <input 
                            type="text" placeholder="Card Number (e.g. 4242 4242 4242)" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        {errors.cardNumber && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errors.cardNumber}</span>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <input 
                              type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                              style={{
                                background: '#0a0f1a', border: errors.cardExpiry ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                                padding: '0.65rem 0.85rem', borderRadius: '10px', color: '#ffffff', outline: 'none', fontSize: '0.85rem'
                              }}
                            />
                            {errors.cardExpiry && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errors.cardExpiry}</span>}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <input 
                              type="password" placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4}
                              style={{
                                background: '#0a0f1a', border: errors.cardCvv ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                                padding: '0.65rem 0.85rem', borderRadius: '10px', color: '#ffffff', outline: 'none', fontSize: '0.85rem'
                              }}
                            />
                            {errors.cardCvv && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errors.cardCvv}</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          background: '#0a0f1a', border: errors.upiId ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                          padding: '0.65rem 0.85rem', borderRadius: '10px'
                        }}>
                          <FiGlobe style={{ color: '#94a3b8' }} />
                          <input 
                            type="text" placeholder="UPI ID (e.g. name@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        {errors.upiId && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{errors.upiId}</span>}
                      </div>
                    )}

                    {paymentMethod === 'wallet' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        {['gpay', 'paypal', 'paytm'].map(w => (
                          <div 
                            key={w} onClick={() => setSelectedWallet(w)}
                            style={{
                              padding: '0.5rem', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                              background: selectedWallet === w ? 'rgba(255,255,255,0.08)' : 'transparent',
                              border: `1px solid ${selectedWallet === w ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)'}`,
                              color: '#ffffff', fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize'
                            }}
                          >
                            {w === 'gpay' ? 'Google Pay' : w}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                  <button
                    type="button" onClick={() => setStep('details')}
                    disabled={processing}
                    style={{
                      padding: '1rem 1.5rem', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#cbd5e1', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={processing}
                    className="gradient-button"
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '16px',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
                      color: '#ffffff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                      boxShadow: '0 10px 25px -5px rgba(99,102,241,0.4)', transition: 'all 0.3s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    {processing ? 'Verifying payment...' : `Pay ₹${totalAmount} & Register`}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'success' && renderSuccessStep()}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Responsive styles */}
      <style>{`
        .sm-two-column-inputs {
          grid-template-columns: 1fr;
        }
        @media (min-width: 576px) {
          .sm-two-column-inputs {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
