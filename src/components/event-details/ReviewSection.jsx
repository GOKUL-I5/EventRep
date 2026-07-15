import React, { useState, useEffect } from 'react';
import { FiStar, FiThumbsUp, FiMessageSquare } from 'react-icons/fi';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';

export default function ReviewSection({ eventId, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real-time listener for reviews
  useEffect(() => {
    if (!eventId) return;
    const q = query(
      collection(db, "events", eventId, "reviews"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error loading reviews: ", error);
    });
    return () => unsubscribe();
  }, [eventId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please login to submit a review!");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "events", eventId, "reviews"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userPhoto: currentUser.photoURL || "",
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });
      setComment("");
      toast.success("Review submitted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  // Mock score breakdown values
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "4.8";
  const totalReviews = reviews.length > 0 ? reviews.length : 12;

  // Star metrics counts helper
  const starCounts = [0, 0, 0, 0, 0];
  if (reviews.length > 0) {
    reviews.forEach(r => {
      const idx = Math.max(1, Math.min(5, Math.round(r.rating))) - 1;
      starCounts[idx]++;
    });
  } else {
    starCounts[4] = 8;
    starCounts[3] = 3;
    starCounts[2] = 1;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
        <FiMessageSquare style={{ color: '#818cf8' }} /> Attendee Reviews ({totalReviews})
      </h3>

      {/* Stats Breakdown Bar Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2rem',
        alignItems: 'center',
        padding: '1.75rem',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap'
      }}>
        {/* Average Rating Score block */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#ffffff', display: 'block', lineHeight: 1 }}>
            {averageRating}
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem', margin: '0.6rem 0' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <FiStar 
                key={s} 
                size={16} 
                fill={s <= Math.round(Number(averageRating)) ? '#f59e0b' : 'none'} 
                style={{ color: s <= Math.round(Number(averageRating)) ? '#f59e0b' : 'rgba(255,255,255,0.2)' }} 
              />
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Based on {totalReviews} reviews</span>
        </div>

        {/* Horizontal Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars - 1] || 0;
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                <span style={{ width: '40px', color: 'var(--color-text-secondary)', textAlign: 'right', fontWeight: '500' }}>
                  {stars} stars
                </span>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    borderRadius: '10px'
                  }} />
                </div>
                <span style={{ width: '30px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form */}
      {currentUser && (
        <form onSubmit={handleSubmitReview} style={{
          display: 'flex', flexDirection: 'column', gap: '1rem',
          padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>Write your Review</h4>
          
          {/* Star selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Select Score:</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <FiStar
                  key={s}
                  size={20}
                  style={{
                    color: s <= (hoverRating || rating) ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                  fill={s <= (hoverRating || rating) ? '#f59e0b' : 'none'}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                />
              ))}
            </div>
          </div>

          <textarea
            placeholder="Share your thoughts about this event..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: 'flex-start',
              padding: '0.6rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
            }}
          >
            {submitting ? 'Posting...' : 'Post Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div 
              key={rev.id}
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                gap: '1rem'
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: rev.userPhoto ? `url(${rev.userPhoto}) center/cover` : 'rgba(255,255,255,0.08)'
              }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#cbd5e1' }}>{rev.userName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {rev.createdAt?.seconds ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                
                {/* Review Stars */}
                <div style={{ display: 'flex', gap: '0.15rem', marginBottom: '0.6rem' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar 
                      key={s} 
                      size={12} 
                      fill={s <= rev.rating ? '#f59e0b' : 'none'} 
                      style={{ color: s <= rev.rating ? '#f59e0b' : 'rgba(255,255,255,0.15)' }} 
                    />
                  ))}
                </div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {rev.comment}
                </p>

                {/* Like Review action */}
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'transparent', border: 'none', color: 'var(--color-text-secondary)',
                    fontSize: '0.75rem', cursor: 'pointer'
                  }}>
                    <FiThumbsUp size={12} /> Like Review
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed rgba(255,255,255,0.05)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem'
          }}>
            No reviews yet. Be the first to review this event!
          </div>
        )}
      </div>
    </div>
  );
}
