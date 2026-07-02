import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiCalendar, FiMapPin, FiGrid, FiList, 
  FiDollarSign, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { useEvent } from '../context/EventContext';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import { categories } from '../utils/categories';

const Dashboard = () => {
  const { events, loadingEvents, isSeeding } = useEvent();
  
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredEvents = useMemo(() => {
    let result = events || [];

    if (activeCategory !== 'all') {
      result = result.filter(ev => ev.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ev => ev.title.toLowerCase().includes(q) || (ev.tags && ev.tags.some(t => t.toLowerCase().includes(q))));
    }
    if (locationFilter) {
      const l = locationFilter.toLowerCase();
      result = result.filter(ev => ev.location.toLowerCase().includes(l) || (ev.venue && ev.venue.toLowerCase().includes(l)));
    }
    if (priceFilter === 'free') result = result.filter(ev => Number(ev.price) === 0);
    if (priceFilter === 'paid') result = result.filter(ev => Number(ev.price) > 0);
    
    if (statusFilter !== 'all') {
      result = result.filter(ev => (ev.status || 'draft').toLowerCase() === statusFilter);
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      result = result.filter(ev => {
        if(!ev.date) return true;
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

    return result.sort((a, b) => {
      if (sortBy === 'default') {
        const getGroup = (ev) => {
          if ((ev.status || '').toLowerCase() === 'live') return 1;
          if ((ev.status || '').toLowerCase() === 'upcoming') return 2;
          if (ev.isTrending) return 3;
          return 4;
        };
        const groupA = getGroup(a);
        const groupB = getGroup(b);
        if (groupA !== groupB) return groupA - groupB;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      if (sortBy === 'popularity') return (b.registeredCount || 0) - (a.registeredCount || 0);
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'dateAsc') return new Date(a.date || 0) - new Date(b.date || 0);
      if (sortBy === 'dateDesc') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'priceAsc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'priceDesc') return (b.price || 0) - (a.price || 0);
      return 0;
    });
  }, [events, activeCategory, searchQuery, locationFilter, priceFilter, dateFilter, statusFilter, sortBy]);

  const displayedEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
        
        {/* Header & Main Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', background: 'none', WebkitTextFillColor: 'var(--color-text-primary)' }}>Events Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Discover, track, and manage all your favorite experiences.</p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)', borderRadius: '12px', padding: '0.75rem 1rem', flex: 1, minWidth: '300px', boxShadow: 'var(--shadow-sm)' }}>
              <FiSearch color="var(--color-text-secondary)" size={20} />
              <input 
                type="text" 
                placeholder="Search events, tags, or artists..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.75rem', width: '100%', color: 'var(--color-text-primary)', fontSize: '1rem' }}
              />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showFilters ? 'var(--color-accent)' : 'var(--color-bg-surface)', color: showFilters ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-glass-border)', borderRadius: '12px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
            >
              <FiFilter /> Filters
            </button>

            {/* View Toggles */}
            <div style={{ display: 'flex', background: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)', borderRadius: '12px', padding: '0.25rem' }}>
              <button onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <FiGrid size={20} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <FiList size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Scroller */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '20px', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s',
                background: activeCategory === cat.id ? cat.color : 'var(--color-bg-surface)',
                color: activeCategory === cat.id ? '#fff' : 'var(--color-text-secondary)',
                border: `1px solid ${activeCategory === cat.id ? 'transparent' : 'var(--color-glass-border)'}`,
                boxShadow: activeCategory === cat.id ? `0 4px 12px ${cat.color}40` : 'none'
              }}
            >
              {cat.name}
            </button>
          ))}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                
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
                  <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Date Range</label>
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

                {/* Status Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Event Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                    <FiCheckCircle color="var(--color-text-secondary)" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}>
                      <option value="all" style={{color: 'black'}}>All Statuses</option>
                      <option value="published" style={{color: 'black'}}>Upcoming (Published)</option>
                      <option value="live" style={{color: 'black'}}>Live Now</option>
                      <option value="completed" style={{color: 'black'}}>Completed</option>
                    </select>
                  </div>
                </div>

                {/* Sort Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Sort By</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-glass-border)' }}>
                    <FiTrendingUp color="var(--color-text-secondary)" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)' }}>
                      <option value="default" style={{color: 'black'}}>Featured & Live</option>
                      <option value="newest" style={{color: 'black'}}>Recently Added</option>
                      <option value="popularity" style={{color: 'black'}}>Most Popular</option>
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

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Showing {displayedEvents.length} of {filteredEvents.length} events</span>
        </div>

        {/* Events Grid/List */}
        {isSeeding ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
          >
            <div className="skeleton-pulse" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>...</span>
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>Setting up your platform...</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
              We are automatically generating and seeding 100 realistic events into your database so you can explore all features right away. This will just take a few seconds!
            </p>
          </motion.div>
        ) : loadingEvents ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => <EventSkeleton key={i} viewMode={viewMode} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '50%', color: 'var(--color-text-secondary)' }}>
              <FiSearch size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem' }}>No events found</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>We couldn't find any events matching your current filters. Try adjusting your search criteria or explore other categories.</p>
            <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); setLocationFilter(''); setPriceFilter('all'); setDateFilter('all'); setStatusFilter('all'); }} style={{ marginTop: '1rem', background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '1.5rem' }}>
              <AnimatePresence>
                {displayedEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} viewMode={viewMode} index={index} />
                ))}
              </AnimatePresence>
            </div>
            
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  onClick={handleLoadMore}
                  style={{ background: 'transparent', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)', padding: '0.75rem 2rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                  className="hover-bg"
                >
                  Load More Events
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
