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
  
  // Real-time Likes and Bookmarks states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [qrValue, setQrValue] = useState('');

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
    fetchEventDetails();
  }, [id]);

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



            {/* Reviews list dashboard */}
            <ReviewSection eventId={id} currentUser={currentUser} />

            {/* Recommended events scroller */}
            <RecommendationCarousel 
              events={events} 
              currentEventId={id} 
              category={event.category} 
            />
          </div>

          {/* RIGHT COLUMN: Tickets Checkout, Organizer profile, Maps directions */}
          <div className="lg:col-span-1 flex flex-col gap-10 lg:sticky lg:top-6">
            
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

            {/* Organizer Profile Stats widget */}
            <OrganizerCard event={event} />

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
