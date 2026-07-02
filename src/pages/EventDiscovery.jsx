import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { FiSearch, FiFilter, FiCalendar, FiMapPin, FiHeart, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const categories = [
  { id: 'all', name: 'All Events', color: 'var(--color-accent)' },
  { id: 'music', name: 'Music', color: '#ec4899' },
  { id: 'corporate', name: 'Corporate', color: '#3b82f6' },
  { id: 'college_fest', name: 'College Fest', color: '#8b5cf6' },
  { id: 'hackathon', name: 'Hackathon', color: '#10b981' },
  { id: 'sports', name: 'Sports', color: '#f59e0b' },
  { id: 'wedding', name: 'Wedding', color: '#f43f5e' },
  { id: 'birthday', name: 'Birthday', color: '#14b8a6' },
  { id: 'startup', name: 'Startup', color: '#6366f1' },
  { id: 'workshop', name: 'Workshop', color: '#84cc16' },
  { id: 'seminar', name: 'Seminar', color: '#06b6d4' },
  { id: 'technology', name: 'Technology', color: '#3b82f6' },
  { id: 'food_festival', name: 'Food Festival', color: '#f97316' },
  { id: 'gaming', name: 'Gaming', color: '#a855f7' },
  { id: 'ngo', name: 'NGO', color: '#22c55e' },
  { id: 'fashion', name: 'Fashion', color: '#d946ef' },
  { id: 'community', name: 'Community', color: '#0ea5e9' }
];

const EventDiscovery = () => {
  const { events, loadingEvents, toggleLikeEvent } = useEvent();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'free', 'paid'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState('dateAsc'); // 'dateAsc', 'dateDesc', 'priceAsc', 'priceDesc', 'popularity', 'trending'
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    let result = events;

    // 1. Category Filter
    if (activeCategory !== 'all') {
      result = result.filter(ev => ev.category === activeCategory);
    }

    // 2. Text Search (Title)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ev => ev.title.toLowerCase().includes(q));
    }

    // 3. Location Filter
    if (locationFilter) {
      const l = locationFilter.toLowerCase();
      result = result.filter(ev => ev.location.toLowerCase().includes(l));
    }

    // 4. Price Filter
    if (priceFilter === 'free') result = result.filter(ev => Number(ev.price) === 0);
    if (priceFilter === 'paid') result = result.filter(ev => Number(ev.price) > 0);

    // 5. Date Filter
    if (dateFilter !== 'all') {
      const today = new Date();
      result = result.filter(ev => {
        const evDate = new Date(ev.date);
        if (dateFilter === 'today') return evDate.toDateString() === today.toDateString();
        if (dateFilter === 'week') {
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return evDate >= today && evDate <= nextWeek;
        }
        if (dateFilter === 'month') {
          return evDate.getMonth() === today.getMonth() && evDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    // 6. Sorting (includes Popularity and Trending)
    return result.sort((a, b) => {
      if (sortBy === 'popularity') return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === 'trending') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0); // Newest first for trending stub
      if (sortBy === 'dateAsc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'dateDesc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      return 0;
    });
  }, [events, activeCategory, searchQuery, locationFilter, priceFilter, dateFilter, sortBy]);

  const activeCategoryData = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Dynamic Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeCategory} // Force re-render animation when category changes
          className="card"
          style={{ 
            padding: '3rem', 
            borderRadius: '24px', 
            background: `linear-gradient(135deg, ${activeCategoryData.color}20, var(--color-bg-surface))`,
            borderLeft: `4px solid ${activeCategoryData.color}`
          }}
        >
          <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--color-text-primary)' }}>
            Discover <span style={{ color: activeCategoryData.color }}>{activeCategoryData.name}</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.2rem' }}>
            Find the best experiences happening near you.
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '12px', padding: '0.5rem 1rem', flex: 1, minWidth: '300px' }}>
              <FiSearch color="var(--color-text-secondary)" />
              <input 
                type="text" 
                placeholder="Search events by title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}
              />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showFilters ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)', color: showFilters ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-glass-border)', borderRadius: '12px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              <FiFilter /> Advanced Filters
            </button>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-glass-border)', borderRadius: '16px' }}>
                  
                  {/* Location Filter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Location</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                      <FiMapPin color="var(--color-text-secondary)" />
                      <input type="text" placeholder="City or venue" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }} />
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Date</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                      <FiCalendar color="var(--color-text-secondary)" />
                      <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}>
                        <option value="all" style={{color: 'black'}}>Any Time</option>
                        <option value="today" style={{color: 'black'}}>Today</option>
                        <option value="week" style={{color: 'black'}}>This Week</option>
                        <option value="month" style={{color: 'black'}}>This Month</option>
                      </select>
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Price</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                      <FiDollarSign color="var(--color-text-secondary)" />
                      <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}>
                        <option value="all" style={{color: 'black'}}>Any Price</option>
                        <option value="free" style={{color: 'black'}}>Free Only</option>
                        <option value="paid" style={{color: 'black'}}>Paid Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Sort Filter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Sort By</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                      <FiTrendingUp color="var(--color-text-secondary)" />
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}>
                        <option value="popularity" style={{color: 'black'}}>Most Popular</option>
                        <option value="trending" style={{color: 'black'}}>Trending (New)</option>
                        <option value="dateAsc" style={{color: 'black'}}>Date: Soonest</option>
                        <option value="dateDesc" style={{color: 'black'}}>Date: Furthest</option>
                        <option value="priceAsc" style={{color: 'black'}}>Price: Low to High</option>
                        <option value="priceDesc" style={{color: 'black'}}>Price: High to Low</option>
                      </select>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Scroller */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '20px', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s',
                background: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat.id ? '#fff' : 'var(--color-text-secondary)',
                border: `1px solid ${activeCategory === cat.id ? 'transparent' : 'var(--color-glass-border)'}`
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        {loadingEvents ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading experiences...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>No events found</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.3)', transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
                >
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {categories.find(c => c.id === event.category)?.name || 'Event'}
                    </span>
                  </div>

                  <div style={{ 
                    height: '180px', width: '100%', 
                    background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--color-glass-border)',
                    transition: 'transform 0.3s ease'
                  }} />

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        <FiCalendar /> {event.date} at {event.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <FiMapPin /> {event.location}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-accent)' }}>
                        {event.price === 0 ? 'Free' : `$${event.price}`}
                      </span>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => toggleLikeEvent(event.id, false)} // Just a toggle placeholder, we would normally check if already liked
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-danger)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <FiHeart />
                        </button>
                        <Link 
                          to={`/events/${event.id}`}
                          style={{ background: 'var(--color-accent)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default EventDiscovery;
