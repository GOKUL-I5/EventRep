import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DashboardLayout from '../layouts/DashboardLayout';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const ManageEvents = () => {
  const { currentUser } = useAuth();
  const { deleteEvent, duplicateEvent, updateEvent } = useEvent();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, [currentUser]);

  const fetchMyEvents = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "events"), where("organizerId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
    // If approved or pending, Unpublish to draft. If draft or rejected, Submit for review (pending).
    const newStatus = (event.status === 'approved' || event.status === 'pending') ? 'draft' : 'pending';
    try {
      await updateEvent(event.id, { status: newStatus });
      setMyEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: newStatus } : ev));
      toast.success(newStatus === 'pending' ? 'Event submitted for review' : 'Event unpublished to draft');
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
    </DashboardLayout>
  );
};

const actionBtnStyle = {
  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--color-glass-border)',
  color: 'var(--color-text-secondary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none'
};

export default ManageEvents;
