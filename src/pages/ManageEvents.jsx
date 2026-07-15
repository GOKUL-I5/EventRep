import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff, FiPlus, FiUsers, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DashboardLayout from '../layouts/DashboardLayout';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const ManageEvents = () => {
  const { currentUser, userData } = useAuth();
  const { deleteEvent, duplicateEvent, updateEvent } = useEvent();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bookings management states
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  useEffect(() => {
    fetchMyEvents();
  }, [currentUser]);

  const fetchMyEvents = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "events"), where("organizerId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ev => ev.status !== 'deleted');
      
      // Sort client-side by createdAt descending to avoid index errors
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return timeB - timeA;
      });

      setMyEvents(fetched);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load your events");
    }
    setLoading(false);
  };

  const fetchBookingsForEvent = async (eventId, eventTitle) => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle);
    setLoadingBookings(true);
    setShowBookingsModal(true);
    try {
      const q = query(collection(db, "bookings"), where("eventId", "==", eventId));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(fetched);
    } catch (error) {
      console.error("Error loading event bookings: ", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteEvent(id);
        setMyEvents(prev => prev.filter(ev => ev.id !== id));
        toast.success("Event deleted");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateEvent(id);
      toast.success("Event duplicated as draft");
      fetchMyEvents(); // Refresh list to show new copy
    } catch (error) {
      toast.error("Failed to duplicate event");
    }
  };

  const toggleStatus = async (event) => {
    const isApproved = userData?.isApprovedCreator === true || userData?.role === 'super_admin';
    const newStatus = (event.status === 'approved' || event.status === 'pending') 
      ? 'draft' 
      : (isApproved ? 'approved' : 'pending');
    try {
      await updateEvent(event.id, { status: newStatus });
      setMyEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: newStatus } : ev));
      toast.success(
        newStatus === 'approved' ? 'Event published successfully!' :
        newStatus === 'pending' ? 'Event submitted for review' : 
        'Event unpublished to draft'
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', background: 'none', WebkitTextFillColor: 'var(--color-text-primary)' }}>Manage Events</h1>
        <Link to="/events/create" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none',
          background: 'var(--color-accent)', color: '#fff',
          padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600'
        }}>
          <FiPlus /> Create Event
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading events...</div>
      ) : myEvents.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>No events found</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>You haven't created any events yet.</p>
          <Link to="/events/create" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: '600' }}>Create your first event</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myEvents.map((event) => (
            <motion.div key={event.id} className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', padding: '1.5rem', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ 
                width: '120px', height: '80px', borderRadius: '8px',
                background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--color-glass-border)'
              }} />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{event.title}</h3>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                  <span>{event.date} at {event.time}</span>
                  <span style={{ 
                    padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                    background: event.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : event.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : event.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: event.status === 'approved' ? 'var(--color-success)' : event.status === 'pending' ? '#f59e0b' : event.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-text-secondary)'
                  }}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => fetchBookingsForEvent(event.id, event.title)} title="View Bookings" style={actionBtnStyle}>
                  <FiUsers size={18} />
                </button>
                <button onClick={() => toggleStatus(event)} title={(event.status === 'approved' || event.status === 'pending') ? 'Unpublish to Draft' : 'Submit for Review'} style={actionBtnStyle}>
                  {(event.status === 'approved' || event.status === 'pending') ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
                <Link to={`/events/edit/${event.id}`} title="Edit" style={actionBtnStyle}><FiEdit2 size={18} /></Link>
                <button onClick={() => handleDuplicate(event.id)} title="Duplicate" style={actionBtnStyle}><FiCopy size={18} /></button>
                <button onClick={() => handleDelete(event.id)} title="Delete" style={{...actionBtnStyle, color: 'var(--color-danger)'}}><FiTrash2 size={18} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bookings Overlay Modal Dashboard */}
      {showBookingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '1rem'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%', maxWidth: '800px',
              background: 'rgba(25, 35, 55, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
              padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>Booking Management</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedEventTitle}</span>
              </div>
              <button onClick={() => setShowBookingsModal(false)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                <FiX size={20} />
              </button>
            </div>

            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading attendee list...</div>
            ) : (
              <>
                {/* Stats Counters Dashboard */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Bookings</span>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', marginTop: '0.25rem' }}>
                      {bookings.length}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Tickets Sold</span>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '800', color: '#818cf8', marginTop: '0.25rem' }}>
                      {bookings.reduce((sum, b) => sum + (b.quantity || 0), 0)}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Revenue</span>
                    <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
                      ₹{bookings.reduce((sum, b) => sum + (b.amount || 0), 0)}
                    </span>
                  </div>
                </div>

                {/* Attendees Table Grid */}
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Attendee</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Contact Details</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Ticket</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Payment</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No attendees registered yet.</td>
                        </tr>
                      ) : (
                        bookings.map(b => (
                          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ fontWeight: '600', display: 'block', color: '#f8fafc' }}>{b.attendeeName}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.1rem' }}>{b.attendeeAddress}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                              <span style={{ display: 'block' }}>{b.attendeeEmail}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{b.attendeePhone}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                              <span>{b.quantity} x {b.ticketType || 'General'}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                color: b.paymentStatus === 'completed' ? '#10b981' : '#f59e0b',
                                fontWeight: '600',
                                display: 'block'
                              }}>
                                {b.paymentStatus || 'pending'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.1rem' }}>
                                {b.amount === 0 ? 'Free' : `₹${b.amount}`}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600',
                                background: b.bookingStatus === 'confirmed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: b.bookingStatus === 'confirmed' ? '#10b981' : '#fca5a5'
                              }}>
                                {b.bookingStatus || 'confirmed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

const actionBtnStyle = {
  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--color-glass-border)',
  color: 'var(--color-text-secondary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none'
};

export default ManageEvents;
