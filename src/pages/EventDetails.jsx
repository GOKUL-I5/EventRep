import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

// Subcomponents
import EventHero from '../components/event-details/EventHero';
import TicketCard from '../components/event-details/TicketCard';
import OrganizerCard from '../components/event-details/OrganizerCard';
import GoogleMapCard from '../components/event-details/GoogleMapCard';
import EventTimeline from '../components/event-details/EventTimeline';
import ReviewSection from '../components/event-details/ReviewSection';
import RecommendationCarousel from '../components/event-details/RecommendationCarousel';
import BookingForm from '../components/booking/BookingForm';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadPDFTicket } from '../utils/pdfGenerator';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEventById, events, myTickets, fetchMyTickets, toggleLikeEvent, toggleBookmarkEvent, cancelTicket, deleteEvent } = useEvent();
  const { currentUser, userData } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [error, setError] = useState(null);
  
<<<<<<< HEAD
  // Real-time Likes and Bookmarks states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [qrValue, setQrValue] = useState('');
=======
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
>>>>>>> 102ff79748ed9d92c11d9afba904b1e9c8466c00

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEventById(id);
      if (!data) {
        setEvent(null);
        setLoading(false);
        return;
      }
      setEvent(data);

      // Fetch Organizer details
      if (data.organizerId) {
        const orgDoc = await getDoc(doc(db, "users", data.organizerId));
        if (orgDoc.exists()) {
          setOrganizer(orgDoc.data());
        }
      }
    } catch (err) {
      console.error("Error loading event: ", err);
      setError(err.message || "Failed to load event details. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    fetchEventDetails();
  }, [id]);
=======
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
>>>>>>> 102ff79748ed9d92c11d9afba904b1e9c8466c00

  // Listen to bookmarks and likes
  useEffect(() => {
    if (!currentUser || !id) return;

    const bookmarkRef = doc(db, "users", currentUser.uid, "interactions", "bookmarks");
    const unsubscribeBookmark = onSnapshot(bookmarkRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsBookmarked(!!docSnap.data()[id]);
      } else {
        setIsBookmarked(false);
      }
    }, (err) => {
      console.warn("Bookmarks listener failed: ", err);
    });

    const likeRef = doc(db, "users", currentUser.uid, "interactions", "likes");
    const unsubscribeLike = onSnapshot(likeRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsLiked(!!docSnap.data()[id]);
      } else {
        setIsLiked(false);
      }
    }, (err) => {
      console.warn("Likes listener failed: ", err);
    });

    return () => {
      unsubscribeBookmark();
      unsubscribeLike();
    };
  }, [currentUser, id]);

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      toast.error("Please login to bookmark events!");
      return;
    }
    try {
      await toggleBookmarkEvent(id, isBookmarked);
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks!");
    } catch (err) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error("Please login to like events!");
      return;
    }
    try {
      await toggleLikeEvent(id, isLiked);
    } catch (err) {
      toast.error("Failed to update like status");
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      toast.error("Please login to register for events!");
      return;
    }
    setShowBookingForm(true);
  };

  const handleConfirmBooking = async (bookingDetails) => {
    if (!currentUser) {
      toast.error("Please login to register!");
      return;
    }
    setLoadingRegister(true);
    try {
      const bookingRef = doc(collection(db, "bookings"));
      const bookingId = bookingRef.id;

      const qrCodeData = JSON.stringify({
        bookingId,
        eventId: id,
        attendeeName: bookingDetails.attendeeName,
        eventName: event.title,
        bookingDate: new Date().toLocaleDateString()
      });

      const newBooking = {
        bookingId,
        eventId: id,
        eventTitle: event.title,
        userId: currentUser.uid,
        attendeeName: bookingDetails.attendeeName,
        attendeeEmail: bookingDetails.attendeeEmail,
        attendeePhone: bookingDetails.attendeePhone,
        attendeeAddress: bookingDetails.attendeeAddress,
        attendeeLinkedin: bookingDetails.attendeeLinkedin || '',
        ticketType: bookingDetails.ticketType,
        quantity: bookingDetails.quantity,
        amount: bookingDetails.amount,
        paymentStatus: 'completed',
        bookingStatus: 'confirmed',
        paymentId: bookingDetails.amount === 0 ? 'FREE' : `PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        createdAt: serverTimestamp()
      };
      await setDoc(bookingRef, newBooking);

      const ticketRef = doc(collection(db, "tickets"));
      const newTicket = {
        id: ticketRef.id,
        eventId: id,
        userId: currentUser.uid,
        bookingId,
        status: 'active',
        qrCodeData,
        createdAt: serverTimestamp()
      };
      await setDoc(ticketRef, newTicket);

      const notifRef = doc(collection(db, `users/${currentUser.uid}/notifications`));
      await setDoc(notifRef, {
        title: "Booking Successful!",
        message: `You secured ${bookingDetails.quantity} tickets for ${event.title}. Pass ID: ${bookingId.substring(0, 8).toUpperCase()}`,
        type: "success",
        read: false,
        createdAt: serverTimestamp(),
        link: "/tickets"
      });

      const eventRef = doc(db, "events", id);
      const totalCapacity = event.capacity || 100;
      const registeredCount = (event.registeredCount || 0) + bookingDetails.quantity;
      const availableSeats = Math.max(0, totalCapacity - registeredCount);
      await updateDoc(eventRef, {
        registeredCount,
        availableSeats
      });

      setEvent(prev => ({
        ...prev,
        registeredCount,
        availableSeats
      }));

      toast.success("Ticket booked successfully!");
      
      await fetchMyTickets();

      return { bookingId, qrCodeData, newBooking };
    } catch (err) {
      console.error("Booking error: ", err);
      toast.error("Failed to complete booking");
      throw err;
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleCancelRegistration = async () => {
    const activeTicket = myTickets.find(t => t.eventId === id && t.userId === currentUser?.uid);
    if (!activeTicket) return;
    
    if (window.confirm("Are you sure you want to cancel your registration?")) {
      try {
        await cancelTicket(activeTicket.id);
        toast.success("Registration cancelled successfully.");
      } catch (err) {
        toast.error("Failed to cancel registration");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) {
      try {
        await deleteEvent(id);
        toast.success("Event deleted successfully!");
        navigate('/events/manage');
      } catch (err) {
        toast.error("Failed to delete event");
      }
    }
  };

  const ticket = useMemo(() => {
    return myTickets.find(t => t.eventId === id && t.userId === currentUser?.uid);
  }, [myTickets, id, currentUser]);

  const isRegistered = !!ticket;
  const isOwner = currentUser && event && event.organizerId === currentUser.uid;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="w-32 h-5 bg-white/5 rounded-lg mb-8" />
          <div className="w-full h-[400px] bg-white/3 rounded-3xl mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="w-full h-[180px] bg-white/3 rounded-3xl" />
              <div className="w-full h-[240px] bg-white/3 rounded-3xl" />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
              <div className="w-full h-[320px] bg-white/3 rounded-3xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-24 p-12 bg-white/2 backdrop-blur-xl border border-white/8 rounded-3xl text-center flex flex-col items-center gap-6 shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white">
            {error ? 'Failed to Load Event' : 'Event Not Found'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {error || 'The event you are looking for might have been removed, or the link is incorrect.'}
          </p>
          <button 
            onClick={() => navigate('/explore')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/20 transition-all duration-150 cursor-pointer"
          >
            Back to Explore
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen text-slate-100 max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Ambient background glows for visual depth */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />

        {/* Back navigation & Admin Quick Actions */}
        <div className="flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 bg-transparent border-none text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Back to Explore
          </button>

          {isOwner && (
            <div className="flex gap-3">
              <button 
                onClick={() => navigate(`/events/manage?edit=${event.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-slate-200 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all duration-200 cursor-pointer"
              >
                <Edit size={14} /> Edit
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-300 hover:text-white hover:bg-rose-500 text-sm font-semibold transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* SECTION 1: Hero Banner */}
        <div className="z-10">
          <EventHero 
            event={event} 
            isBookmarked={isBookmarked} 
            onToggleBookmark={handleToggleBookmark} 
          />
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start z-10">
          
          {/* LEFT COLUMN: About, Schedule, FAQ, Reviews */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            
            {/* About Event */}
            <div className="bg-white/2 border border-white/4 rounded-3xl p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-white/5 pb-4">
                About the Event
              </h2>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {event.description || 'No description available for this event.'}
              </p>
            </div>

            {/* Gallery Section */}
            {event.galleryUrls && event.galleryUrls.length > 0 && (
              <div className="bg-white/2 border border-white/4 rounded-3xl p-8 md:p-10 shadow-2xl">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">
                  Gallery & Media
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.galleryUrls.map((url, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      key={i} 
                      className="relative overflow-hidden rounded-2xl aspect-video border border-white/5 bg-slate-950 shadow-inner"
                    >
                      <img 
                        src={url} 
                        alt={`Gallery screenshot ${i+1}`} 
                        className="w-full h-full object-cover cursor-pointer" 
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Timeline Agenda */}
            <EventTimeline event={event} />

            {/* Reviews list dashboard */}
            <ReviewSection eventId={id} currentUser={currentUser} />

<<<<<<< HEAD
            {/* Recommended events scroller */}
            <RecommendationCarousel 
              events={events} 
              currentEventId={id} 
              category={event.category} 
            />
          </div>

          {/* RIGHT COLUMN: Tickets Checkout, Organizer profile, Maps directions */}
          <div className="lg:col-span-1 flex flex-col gap-10 lg:sticky lg:top-6">
=======
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
>>>>>>> 102ff79748ed9d92c11d9afba904b1e9c8466c00
            
            {/* Ticket Card Pass stub */}
            <TicketCard 
              event={event}
              user={currentUser ? userData : null}
              ticket={ticket}
              isRegistered={isRegistered}
              loadingRegister={loadingRegister}
              onRegister={handleRegister}
              onCancelTicket={handleCancelRegistration}
              isBookmarked={isBookmarked}
              onToggleBookmark={handleToggleBookmark}
            />

            {/* Location Maps */}
            <GoogleMapCard event={event} />

<<<<<<< HEAD
            {/* Organizer Profile Stats widget */}
            <OrganizerCard event={event} />
=======
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
>>>>>>> 102ff79748ed9d92c11d9afba904b1e9c8466c00

          </div>

        </div>

      </div>

      <AnimatePresence>
        {showBookingForm && (
          <BookingForm 
            event={event}
            user={currentUser ? userData : null}
            loading={loadingRegister}
            onSubmit={handleConfirmBooking}
            onClose={() => setShowBookingForm(false)}
          />
        )}
      </AnimatePresence>
      {qrValue && (
        <div style={{ display: 'none' }}>
          <QRCodeCanvas id="checkout-qr-canvas" value={qrValue} size={150} />
        </div>
      )}
    </DashboardLayout>
  );
}
