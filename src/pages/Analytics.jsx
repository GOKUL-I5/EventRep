import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  FiTrendingUp, FiDollarSign, FiUsers, FiCalendar, 
  FiActivity, FiArrowUpRight, FiAward, FiInfo 
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const Analytics = () => {
  const { events, loadingEvents } = useEvent();
  const { currentUser, userData } = useAuth();
  const [useDemoData, setUseDemoData] = useState(false);

  // Filter events based on active user
  const userEvents = useMemo(() => {
    if (!events) return [];
    // If admin, they see everything by default.
    if (userData?.role === 'admin') {
      return events;
    }
    // Filter by organizerId
    const filtered = events.filter(ev => ev.organizerId === currentUser?.uid);
    return filtered;
  }, [events, currentUser, userData]);

  // Determine if we should show demo data
  const isDemo = useMemo(() => {
    return userEvents.length === 0 || useDemoData;
  }, [userEvents, useDemoData]);

  // Active dataset
  const activeEvents = useMemo(() => {
    if (isDemo) {
      // Use global seeded events as demo data
      return events || [];
    }
    return userEvents;
  }, [events, userEvents, isDemo]);

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    if (activeEvents.length === 0) {
      return { totalRevenue: 0, totalRegistrations: 0, avgFillRate: 0, avgRating: 0 };
    }
    let totalRevenue = 0;
    let totalRegistrations = 0;
    let fillRatesSum = 0;
    let ratingsSum = 0;
    let eventsWithRatings = 0;

    activeEvents.forEach(ev => {
      const registrations = Number(ev.registeredCount) || 0;
      const capacity = Number(ev.capacity) || 1;
      const price = Number(ev.price) || 0;
      
      totalRevenue += registrations * price;
      totalRegistrations += registrations;
      fillRatesSum += (registrations / capacity) * 100;
      
      if (ev.rating) {
        ratingsSum += Number(ev.rating);
        eventsWithRatings++;
      }
    });

    return {
      totalRevenue,
      totalRegistrations,
      avgFillRate: Math.round(fillRatesSum / activeEvents.length),
      avgRating: eventsWithRatings > 0 ? (ratingsSum / eventsWithRatings).toFixed(1) : 'N/A'
    };
  }, [activeEvents]);

  // 2. Data for Revenue / Sales Trend (Area Chart)
  // Group by date (month/day)
  const salesTrendData = useMemo(() => {
    if (activeEvents.length === 0) return [];
    
    // Group and sum registrations/revenue by date
    const dateMap = {};
    activeEvents.forEach(ev => {
      if (!ev.date) return;
      const dateStr = ev.date; // YYYY-MM-DD
      const registrations = Number(ev.registeredCount) || 0;
      const revenue = registrations * (Number(ev.price) || 0);

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, revenue: 0, registrations: 0 };
      }
      dateMap[dateStr].revenue += revenue;
      dateMap[dateStr].registrations += registrations;
    });

    // Sort by date chronologically
    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-15) // Keep last 15 active days
      .map(item => {
        // Format date label (e.g. "Jul 11")
        const dateObj = new Date(item.date);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          ...item,
          name: label,
          Revenue: item.revenue,
          Registrations: item.registrations
        };
      });
  }, [activeEvents]);

  // 3. Data for Category Distribution (Pie Chart)
  const categoryData = useMemo(() => {
    if (activeEvents.length === 0) return [];
    
    const catMap = {};
    activeEvents.forEach(ev => {
      const cat = ev.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + (Number(ev.registeredCount) || 0);
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Show top 6 categories
  }, [activeEvents]);

  // 4. Data for Top Events Performance (Bar Chart)
  const topEventsData = useMemo(() => {
    if (activeEvents.length === 0) return [];
    
    return [...activeEvents]
      .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0))
      .slice(0, 5)
      .map(ev => {
        // Shorten long titles
        const title = ev.title.length > 20 ? ev.title.substring(0, 17) + '...' : ev.title;
        return {
          name: title,
          Registrations: ev.registeredCount || 0,
          Capacity: ev.capacity || 0,
          Revenue: (ev.registeredCount || 0) * (ev.price || 0)
        };
      });
  }, [activeEvents]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--color-text-primary)' }}>Performance Analytics</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
              Track ticket sales, attendance metrics, and revenue generated.
            </p>
          </div>

          {/* Demo Mode Toggle Banner */}
          {isDemo && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: '12px', 
              padding: '0.75rem 1.25rem',
              color: '#F59E0B'
            }}>
              <FiInfo size={20} />
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 'bold' }}>Demo Mode Active:</span> Since you haven't published any events yet, we're displaying global analytics.
              </div>
              {userEvents.length > 0 && (
                <button 
                  onClick={() => setUseDemoData(false)}
                  style={{ background: '#F59E0B', color: '#111', border: 'none', borderRadius: '6px', padding: '0.25rem 0.75rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '0.5rem' }}
                >
                  View My Live Data
                </button>
              )}
            </div>
          )}
        </div>

        {loadingEvents ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div className="skeleton-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>...</span>
            </div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            
            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              {/* Stat card: Revenue */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  border: '1px solid var(--color-glass-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Total Revenue</span>
                  <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: '700' }}>
                    ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h3>
                  <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <FiTrendingUp /> +14.5% from last month
                  </span>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '1rem', borderRadius: '12px' }}>
                  <FiDollarSign size={28} />
                </div>
              </motion.div>

              {/* Stat card: Registrations */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  border: '1px solid var(--color-glass-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Registrations</span>
                  <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: '700' }}>
                    {stats.totalRegistrations.toLocaleString()}
                  </h3>
                  <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <FiTrendingUp /> +8.2% booking rate
                  </span>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '1rem', borderRadius: '12px' }}>
                  <FiUsers size={28} />
                </div>
              </motion.div>

              {/* Stat card: Attendance Rate */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: '1px solid var(--color-glass-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Avg. Capacity Filled</span>
                  <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: '700' }}>
                    {stats.avgFillRate}%
                  </h3>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Across {activeEvents.length} active events
                  </span>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '1rem', borderRadius: '12px' }}>
                  <FiActivity size={28} />
                </div>
              </motion.div>

              {/* Stat card: Rating */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  border: '1px solid var(--color-glass-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Average Rating</span>
                  <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: '700' }}>
                    {stats.avgRating} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>/ 5.0</span>
                  </h3>
                  <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    ★ High audience feedback
                  </span>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '1rem', borderRadius: '12px' }}>
                  <FiAward size={28} />
                </div>
              </motion.div>

            </div>

            {/* Sales Revenue Trend Chart */}
            <motion.div 
              variants={itemVariants}
              className="card"
              style={{ padding: '2rem', border: '1px solid var(--color-glass-border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', margin: 0 }}>Revenue & Registrations Trend</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Daily aggregated metrics showing growth trajectory</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#fff', background: 'var(--color-accent)' }}>Daily Sales</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                {salesTrendData.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                    No sales data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-bg-surface)', 
                          border: '1px solid var(--color-glass-border)', 
                          borderRadius: '8px',
                          color: 'var(--color-text-primary)'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="Registrations" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorRegistrations)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Split Grid: Categories & Top Performing Events */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              
              {/* Category Breakdown (Pie Chart) */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ padding: '2rem', border: '1px solid var(--color-glass-border)', display: 'flex', flexDirection: 'column' }}
              >
                <h4 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Category Breakdown</h4>
                
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: 280, position: 'relative' }}>
                  {categoryData.length === 0 ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>No data available</span>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--color-bg-surface)', 
                              border: '1px solid var(--color-glass-border)', 
                              borderRadius: '8px',
                              color: 'var(--color-text-primary)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Info overlay in center of Donut */}
                      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                          {activeEvents.length}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', tracking: '0.05em' }}>
                          Total Events
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Legend list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                  {categoryData.map((item, index) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></span>
                      <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Performing Events (Bar Chart) */}
              <motion.div 
                variants={itemVariants}
                className="card"
                style={{ padding: '2rem', border: '1px solid var(--color-glass-border)' }}
              >
                <h4 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Top Performing Events</h4>
                
                <div style={{ width: '100%', height: 320 }}>
                  {topEventsData.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                      No event registrations.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topEventsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="var(--color-text-secondary)" fontSize={11} width={80} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--color-bg-surface)', 
                            border: '1px solid var(--color-glass-border)', 
                            borderRadius: '8px',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Registrations" fill="#10B981" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Capacity" fill="rgba(255,255,255,0.1)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

            </div>

          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
