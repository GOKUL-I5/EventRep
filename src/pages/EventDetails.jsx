import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiCalendar, FiMapPin, FiShare2, FiHeart, FiBookmark, FiStar, FiUser, FiArrowLeft, FiClock, FiTag } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import DashboardLayout from '../layouts/DashboardLayout';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEventById, events, myTickets, toggleLikeEvent, toggleBookmarkEvent, registerForEvent } = useEvent();
  const { currentUser } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    fetchEventDetails();
    // Subscribe to reviews
    const q = query(collection(db, `events/${id}/reviews`), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      // Gracefully catch reviews permission error if rules are not deployed yet
      setReviews([]);
    });

    return () => unsubscribe();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const data = await getEventById(id);
      if (!data) {
        toast.error("Event not found!");
        navigate('/explore');
        return;
      }
      setEvent(data);

      // Fetch Organizer
      if (data.organizerId) {
        const orgDoc = await getDoc(doc(db, "users", data.organizerId));
        if (orgDoc.exists()) setOrganizer(orgDoc.data());
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !event) return;

    // Use GSAP Context for clean React animation scoping and automatic cleanup
    const ctx = gsap.context(() => {
      // Animate banner immediately
      gsap.fromTo('.anim-banner', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      
      // Animate cards on scroll
      gsap.utils.toArray('.anim-card').forEach((card) => {
        gsap.fromTo(card, 
          { opacity: 0, y: 30 },
          { 
            opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              scroller: ".dashboard-content", // target the scrolling layout container
              start: 'top 90%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // Force recalculate scroll positions after layout settles
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    });

    return () => ctx.revert(); // clean up all animations and scroll triggers
  }, [loading, event]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please login to leave a review");
      return;
    }
    if (!newReview.trim()) return;

    try {
      await addDoc(collection(db, `events/${id}/reviews`), {
        userId: currentUser.uid,
        userName: currentUser.firstName || currentUser.email.split('@')[0],
        userPhoto: currentUser.photoURL || '',
        text: newReview,
        rating: newRating,
        timestamp: serverTimestamp()
      });
      setNewReview('');
      setNewRating(5);
      toast.success("Review posted!");
    } catch (error) {
      toast.error("Failed to post review");
    }
  };

  const handleRegister = async () => {
    try {
      await registerForEvent(id);
      toast.success("Successfully registered for this event!");
      navigate('/tickets');
    } catch (error) {
      toast.error(error.message || "Failed to register");
    }
  };

  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return events.filter(e => e.category === event.category && e.id !== event.id).slice(0, 3);
  }, [events, event]);

  const isRegistered = myTickets.some(t => t.eventId === id);

  if (loading) return <DashboardLayout><div style={{ padding: '4rem', textAlign: 'center' }}>Loading details...</div></DashboardLayout>;
  if (!event) return null;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', width: 'fit-content' }}>
          <FiArrowLeft /> Back to Explore
        </button>

        {/* Banner Section */}
        <div className="anim-banner" style={{ 
          width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', position: 'relative',
          background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--color-bg-surface)'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-bg-base) 0%, transparent 100%)' }} />
          
          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span style={{ background: 'var(--color-accent)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', width: 'fit-content', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                {event.category}
              </span>
              <h1 style={{ fontSize: '3rem', margin: 0, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{event.title}</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleShare} style={iconBtnStyle}><FiShare2 size={20} /></motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleBookmarkEvent(event.id, false)} style={iconBtnStyle}><FiBookmark size={20} /></motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleLikeEvent(event.id, false)} style={{...iconBtnStyle, color: 'var(--color-danger)'}}>
                <FiHeart size={20} /> <span style={{fontSize:'1rem', fontWeight:'600'}}>{event.likesCount || 0}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Column: Details & Reviews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Quick Info Bar */}
            <div className="card anim-card" style={{ display: 'flex', gap: '2rem', padding: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)', borderRadius: '12px' }}><FiCalendar size={24} /></div>
                <div><span style={{display:'block', fontSize:'0.875rem', color:'var(--color-text-secondary)'}}>Date</span><span style={{fontWeight:'600'}}>{event.date}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: '12px' }}><FiClock size={24} /></div>
                <div><span style={{display:'block', fontSize:'0.875rem', color:'var(--color-text-secondary)'}}>Time</span><span style={{fontWeight:'600'}}>{event.time}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '12px' }}><FiMapPin size={24} /></div>
                <div><span style={{display:'block', fontSize:'0.875rem', color:'var(--color-text-secondary)'}}>Location</span><span style={{fontWeight:'600'}}>{event.location}</span></div>
              </div>
            </div>

            {/* Description */}
            <div className="card anim-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>About this Event</h2>
              <p style={{ lineHeight: '1.8', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                {event.description}
              </p>
            </div>

            {/* Image Gallery */}
            {event.galleryUrls && event.galleryUrls.length > 0 && (
              <div className="card anim-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Image Gallery</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {event.galleryUrls.map((url, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      key={i} 
                      style={{ width: '100%', height: '150px', borderRadius: '12px', background: `url(${url}) center/cover`, cursor: 'pointer' }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Event Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <div className="card anim-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Event Schedule</h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {event.schedule.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                      {i !== event.schedule.length - 1 && <div style={{ position: 'absolute', top: '24px', bottom: '-24px', left: '11px', width: '2px', background: 'var(--color-glass-border)' }} />}
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, paddingBottom: i !== event.schedule.length - 1 ? '2rem' : '0' }}>
                        <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>{item.time}</span>
                        <h4 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>{item.title}</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: '1.5' }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="card anim-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Reviews & Ratings</h2>
              
              {/* Review Form */}
              <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{fontWeight: '500'}}>Rate:</span>
                  {[1,2,3,4,5].map(star => (
                    <FiStar key={star} onClick={() => setNewRating(star)} size={24} fill={newRating >= star ? '#f59e0b' : 'none'} color={newRating >= star ? '#f59e0b' : 'var(--color-text-secondary)'} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
                <textarea 
                  value={newReview} onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your thoughts about this event..." 
                  style={{ width: '100%', minHeight: '80px', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" style={{ alignSelf: 'flex-end', background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Post Review
                </motion.button>
              </form>

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reviews.length === 0 ? <p style={{color:'var(--color-text-secondary)'}}>No reviews yet. Be the first!</p> : reviews.map(review => (
                  <div key={review.id} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: review.userPhoto ? `url(${review.userPhoto}) center/cover` : 'var(--color-glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {!review.userPhoto && <FiUser />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '600' }}>{review.userName}</span>
                        <div style={{ display: 'flex' }}>
                          {[...Array(5)].map((_, i) => <FiStar key={i} size={14} fill={i < review.rating ? '#f59e0b' : 'none'} color={i < review.rating ? '#f59e0b' : 'var(--color-text-secondary)'} />)}
                        </div>
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{review.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizer & Map Grid */}
            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Organizer Info */}
              <div className="card anim-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Organized By</h3>
                {organizer ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: organizer.photoURL ? `url(${organizer.photoURL}) center/cover` : 'var(--color-glass-border)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: '600', fontSize: '1rem' }}>{organizer.firstName} {organizer.lastName}</span>
                      <span style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>@{organizer.username}</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text-secondary)' }}>Organizer info unavailable</span>
                )}
              </div>

              {/* Location Map */}
              <div className="card anim-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Location Map</h3>
                <div style={{ width: '100%', height: '250px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid var(--color-glass-border)' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    style={{ filter: 'invert(90%) hue-rotate(180deg)' }} /* Creates a dark mode map effect */
                  ></iframe>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Ticket & Related */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Ticket Card */}
            <div className="card anim-card" style={{ padding: '2rem', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Tickets from</span>
                <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--color-accent)' }}>
                  {event.price === 0 ? 'Free' : `$${event.price}`}
                </span>
              </div>
              
              {event.ticketTypes && event.ticketTypes.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Select Ticket Type</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {event.ticketTypes.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                        <span style={{ fontWeight: '500' }}>{t.type}</span>
                        <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>{t.price === 0 ? 'Free' : `$${t.price}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Event QR Pass (Preview)</span>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
                  <QRCodeSVG value={`event:${event.id}`} size={120} />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: isRegistered ? 1 : 1.02 }}
                whileTap={{ scale: isRegistered ? 1 : 0.98 }}
                onClick={handleRegister}
                disabled={isRegistered}
                style={{ width: '100%', background: isRegistered ? 'rgba(255,255,255,0.1)' : 'var(--color-accent)', color: isRegistered ? 'var(--color-text-secondary)' : '#fff', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', border: 'none', cursor: isRegistered ? 'not-allowed' : 'pointer', boxShadow: isRegistered ? 'none' : 'var(--shadow-md)', transition: 'transform 0.2s' }}>
                {isRegistered ? 'Already Registered' : 'Register Now'}
              </motion.button>
            </div>

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div className="card anim-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Similar Events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {relatedEvents.map(re => (
                    <div key={re.id} onClick={() => navigate(`/events/${re.id}`)} style={{ display: 'flex', gap: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg">
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: re.imageUrl ? `url(${re.imageUrl}) center/cover` : 'var(--color-glass-border)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{re.title}</span>
                        <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', fontWeight: '600' }}>{re.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

const iconBtnStyle = {
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'background 0.2s'
};

export default EventDetails;
