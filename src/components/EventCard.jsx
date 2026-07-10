import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiMapPin, FiHeart, FiBookmark, FiShare2, FiStar, 
  FiUsers, FiEdit2, FiTrash2, FiClock
} from 'react-icons/fi';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryData } from '../utils/categories';
import { toast } from 'react-toastify';

const EventCard = ({ event, viewMode = 'grid', index = 0 }) => {
  const { toggleLikeEvent, toggleBookmarkEvent, deleteEvent, myTickets } = useEvent();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isOwner = currentUser && event.organizerId === currentUser.uid;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const isRegistered = myTickets.some(t => t.eventId === event.id);

  const category = getCategoryData(event.category);
  
  // Handlers
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    toast.success("Event link copied to clipboard!");
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleLikeEvent(event.id, false); // Toggle logic would ideally check real state
    } catch (err) {
      toast.error("Please login to like events");
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleBookmarkEvent(event.id, false); // Toggle logic
      toast.success("Event bookmarked");
    } catch (err) {
      toast.error("Please login to bookmark events");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(event.id);
        toast.success("Event deleted");
      } catch (err) {
        toast.error("Failed to delete event");
      }
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/events/manage?edit=${event.id}`);
  };

  const renderStatus = () => {
    const status = event.status || 'Upcoming';
    let color = 'var(--color-text-secondary)';
    let bg = 'rgba(255,255,255,0.1)';
    if (status.toLowerCase() === 'live') { color = '#ef4444'; bg = 'rgba(239, 68, 68, 0.1)'; }
    if (status.toLowerCase() === 'completed') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.1)'; }
    if (status.toLowerCase() === 'cancelled') { color = '#f59e0b'; bg = 'rgba(245, 158, 11, 0.1)'; }
    if (status.toLowerCase() === 'pending') { color = '#f59e0b'; bg = 'rgba(245, 158, 11, 0.1)'; }
    if (status.toLowerCase() === 'rejected') { color = '#ef4444'; bg = 'rgba(239, 68, 68, 0.1)'; }
    if (status.toLowerCase() === 'draft') { color = 'rgba(255, 255, 255, 0.5)'; bg = 'rgba(255, 255, 255, 0.05)'; }
    
    return (
      <span style={{ 
        color, background: bg, padding: '0.25rem 0.5rem', 
        borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' 
      }}>
        {status}
      </span>
    );
  };

  // Common Card Content
  const CardImage = () => (
    <div style={{ 
      position: 'relative', width: viewMode === 'list' ? '250px' : '100%', 
      height: viewMode === 'list' ? '100%' : '200px', minHeight: '200px', overflow: 'hidden' 
    }}>
      <div style={{ 
        width: '100%', height: '100%', 
        background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--color-glass-border)',
        transition: 'transform 0.4s ease'
      }} className="card-bg-img" />
      
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
        <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: category.color, padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
          {category.name}
        </span>
      </div>
      
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
        {renderStatus()}
      </div>
    </div>
  );

  const CardBody = () => (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.25rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>
      </div>
      
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
        {event.description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          <FiCalendar /> {event.date} {event.time && `• ${event.time}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <FiMapPin /> {event.venue ? `${event.venue}, ` : ''}{event.location}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#f59e0b' }}>
            <FiStar /> {event.rating || '4.5'} ({event.reviewsCount || 0})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-accent)' }}>
            <FiUsers /> {event.registeredCount || 0} / {event.capacity || 'Unlimited'}
          </span>
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--color-glass-border)', margin: '0.5rem 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
          {Number(event.price) === 0 ? <span style={{ color: 'var(--color-success)'}}>Free</span> : `$${event.price}`}
        </span>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="card-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            {canEdit && (
              <>
                <button onClick={handleEdit} className="icon-btn tooltip" data-tip="Edit"><FiEdit2 /></button>
                <button onClick={handleDelete} className="icon-btn tooltip hover-danger" data-tip="Delete"><FiTrash2 /></button>
              </>
            )}
            <button onClick={handleShare} className="icon-btn tooltip" data-tip="Share"><FiShare2 /></button>
            <button onClick={handleBookmark} className="icon-btn tooltip" data-tip="Bookmark"><FiBookmark /></button>
            <button onClick={handleLike} className="icon-btn tooltip hover-danger" data-tip="Like">
              <FiHeart /> <span style={{fontSize:'0.75rem', marginLeft:'2px'}}>{event.likesCount || 0}</span>
            </button>
          </div>
          
          <button style={{ 
            background: isRegistered ? 'rgba(255,255,255,0.1)' : 'var(--color-accent)', 
            color: isRegistered ? 'var(--color-text-secondary)' : '#fff', 
            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', 
            fontWeight: '600', fontSize: '0.875rem', cursor: isRegistered ? 'default' : 'pointer' 
          }} onClick={(e) => { e.preventDefault(); if(!isRegistered) navigate(`/events/${event.id}`); }}>
            {isRegistered ? 'Registered' : (Number(event.price) === 0 ? 'Register' : 'Buy Ticket')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
      className="card event-card-container"
      onClick={() => navigate(`/events/${event.id}`)}
      style={{ 
        display: 'flex', 
        flexDirection: viewMode === 'list' ? 'row' : 'column', 
        overflow: 'hidden', 
        cursor: 'pointer',
        height: '100%'
      }}
    >
      <CardImage />
      <CardBody />

      <style>{`
        .event-card-container:hover .card-bg-img {
          transform: scale(1.05);
        }
        .icon-btn {
          background: rgba(255,255,255,0.05); border: 1px solid var(--color-glass-border); 
          color: var(--color-text-secondary); padding: 0.5rem; borderRadius: 50%; 
          cursor: pointer; display: flex; align-items: center; transition: all 0.2s;
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.1); color: var(--color-text-primary);
        }
        .icon-btn.hover-danger:hover {
          color: var(--color-danger); border-color: var(--color-danger); background: rgba(239, 68, 68, 0.1);
        }
        @media (max-width: 640px) {
          .event-card-container { flex-direction: column !important; }
          .card-bg-img { height: 200px !important; width: 100% !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default EventCard;
