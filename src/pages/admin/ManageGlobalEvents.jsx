import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiCheckCircle, FiXCircle, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ManageGlobalEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "events"));
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt));
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: newStatus });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
      toast.success(`Event marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        setEvents(prev => prev.filter(e => e.id !== eventId));
        toast.success("Event deleted globally");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  if (loading) return <DashboardLayout><div style={{ padding: '4rem', textAlign: 'center' }}>Loading Events...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Global Event Moderation</h1>
        
        <div className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-glass-border)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Event Details</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Organizer ID</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: ev.imageUrl ? `url(${ev.imageUrl}) center/cover` : 'var(--color-glass-border)' }} />
                      <div>
                        <Link to={`/events/${ev.id}`} style={{ display: 'block', fontWeight: '600', color: 'var(--color-text-primary)', textDecoration: 'none', marginBottom: '0.25rem' }}>
                          {ev.title} <FiExternalLink size={12} style={{ color: 'var(--color-text-secondary)' }} />
                        </Link>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{ev.category} • {ev.date}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    <span style={{ fontFamily: 'monospace' }}>{ev.organizerId?.substring(0, 8)}...</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <select 
                      value={ev.status || 'pending'}
                      onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                      style={{ 
                        padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--color-glass-border)',
                        background: ev.status === 'rejected' ? 'rgba(239,68,68,0.1)' : ev.status === 'pending' ? 'rgba(245,158,11,0.1)' : ev.status === 'draft' ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.1)',
                        color: ev.status === 'rejected' ? 'var(--color-danger)' : ev.status === 'pending' ? '#f59e0b' : ev.status === 'draft' ? 'var(--color-text-secondary)' : 'var(--color-success)'
                      }}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                      <option value="draft">Draft</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No events found on the platform.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageGlobalEvents;
