import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiSearch, FiMail, FiCheck, FiX, 
  FiCheckSquare, FiCalendar, FiDownload, FiInfo, FiTag, FiFilter 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import DashboardLayout from '../layouts/DashboardLayout';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const ticketTypes = ['General Admission', 'VIP Pass', 'Early Bird', 'VIP Backstage'];

// Helper to generate mock attendees for a list of events
const generateMockAttendees = (eventsList) => {
  if (!eventsList || eventsList.length === 0) return [];
  
  const mockNames = [
    { first: 'Gokul', last: 'Madara', email: 'gokulmadara.1@gmail.com' },
    { first: 'Aditya', last: 'Verma', email: 'aditya.v@example.com' },
    { first: 'Rohan', last: 'Sharma', email: 'rohan.s@example.com' },
    { first: 'Kavya', last: 'Sundar', email: 'kavya.s@example.com' },
    { first: 'Deepika', last: 'Padukone', email: 'deepika@example.com' },
    { first: 'Vijay', last: 'Sethupathi', email: 'vijay.s@example.com' },
    { first: 'Anirudh', last: 'Ravichander', email: 'ani@example.com' },
    { first: 'Meera', last: 'Nair', email: 'meera.n@example.com' },
    { first: 'Vikram', last: 'Raja', email: 'vikram.r@example.com' },
    { first: 'Pooja', last: 'Hegde', email: 'pooja.h@example.com' },
    { first: 'Siddharth', last: 'Roy', email: 'sid.r@example.com' },
    { first: 'Shruti', last: 'Haasan', email: 'shruti@example.com' },
    { first: 'Arjun', last: 'Das', email: 'arjun.das@example.com' },
    { first: 'Keerthy', last: 'Suresh', email: 'keerthy@example.com' },
    { first: 'Madhavan', last: 'Balaji', email: 'maddy@example.com' }
  ];

  const attendees = [];
  eventsList.forEach((ev, idx) => {
    // Generate between 3 to 6 attendees per event
    const count = 4 + (idx % 3);
    for (let i = 0; i < count; i++) {
      const person = mockNames[(idx * 4 + i) % mockNames.length];
      const type = ticketTypes[(idx + i) % ticketTypes.length];
      const statusSeed = Math.random();
      const status = statusSeed > 0.6 ? 'Checked In' : (statusSeed > 0.15 ? 'Pending' : 'Cancelled');
      
      // Calculate random registration date within last 20 days
      const regDate = new Date();
      regDate.setDate(regDate.getDate() - ((idx + i) % 15));

      attendees.push({
        id: `ticket_${ev.id.substring(0, 5)}_${i}`,
        eventId: ev.id,
        eventTitle: ev.title,
        firstName: person.first,
        lastName: person.last,
        fullName: `${person.first} ${person.last}`,
        email: person.email,
        phone: `+91 98765 43${100 + (idx * 5 + i)}`,
        ticketType: type,
        price: type.includes('VIP') ? (ev.price ? ev.price * 1.5 : 150) : (ev.price || 0),
        status,
        registeredAt: regDate.toISOString().split('T')[0],
        isMock: true
      });
    }
  });

  return attendees.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
};

const Attendees = () => {
  const { events } = useEvent();
  const { currentUser, userData } = useAuth();
  
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter events based on active user role
  const userEvents = useMemo(() => {
    if (!events) return [];
    if (userData?.role === 'admin') {
      return events;
    }
    return events.filter(ev => ev.organizerId === currentUser?.uid);
  }, [events, currentUser, userData]);

  useEffect(() => {
    const fetchAttendeesData = async () => {
      if (!currentUser) {
        setIsDemo(true);
        const eventsForDemo = (events || []).slice(0, 10);
        setAttendees(generateMockAttendees(eventsForDemo));
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let ticketsList = [];
        
        if (userData?.role === 'admin') {
          // Admins can query all tickets
          const ticketsRef = collection(db, "tickets");
          const qTickets = query(ticketsRef);
          const querySnapshot = await getDocs(qTickets);
          if (!querySnapshot.empty) {
            ticketsList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } else {
          // Organizers query tickets by organizerId directly
          const ticketsRef = collection(db, "tickets");
          const q = query(ticketsRef, where("organizerId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            ticketsList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        }

        let realAttendees = [];
        
        if (ticketsList.length > 0) {
          // Map ticket data to full attendee details by fetching user info
          const userPromises = ticketsList.map(async (t) => {
            // Find event detail
            const matchingEvent = events?.find(e => e.id === t.eventId);
            if (!matchingEvent) return null;

            // Fetch registered user profile
            const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", t.userId)));
            let regUser = { firstName: 'Anonymous', lastName: 'User', email: 'N/A', mobileNumber: 'N/A' };
            if (!userSnap.empty) {
              regUser = userSnap.docs[0].data();
            }

            return {
              id: t.id,
              eventId: t.eventId,
              eventTitle: matchingEvent.title,
              firstName: regUser.firstName,
              lastName: regUser.lastName,
              fullName: `${regUser.firstName} ${regUser.lastName}`,
              email: regUser.email,
              phone: regUser.mobileNumber || 'N/A',
              ticketType: t.ticketType || 'General Admission',
              price: t.price || matchingEvent.price || 0,
              status: t.status === 'active' ? 'Pending' : (t.status === 'checked-in' ? 'Checked In' : 'Cancelled'),
              registeredAt: t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              isMock: false
            };
          });

          const resolved = await Promise.all(userPromises);
          realAttendees = resolved.filter(item => item !== null);
        }

        // If no real attendees match, switch to demo data
        if (realAttendees.length === 0) {
          setIsDemo(true);
          // Generate realistic mock data based on user's available events
          // Fallback to all seeded events if user has no events
          const eventsForDemo = userEvents.length > 0 ? userEvents : (events || []).slice(0, 10);
          setAttendees(generateMockAttendees(eventsForDemo));
        } else {
          setIsDemo(false);
          setAttendees(realAttendees);
        }
      } catch (err) {
        console.error("Error fetching attendees:", err);
        // Fallback to mock data on error
        setIsDemo(true);
        const eventsForDemo = userEvents.length > 0 ? userEvents : (events || []).slice(0, 10);
        setAttendees(generateMockAttendees(eventsForDemo));
      } finally {
        setLoading(false);
      }
    };

    if (events && events.length > 0) {
      fetchAttendeesData();
    }
  }, [events, currentUser, userEvents, userData]);

  // Handle toggling check-in state
  const handleCheckInToggle = async (attendee) => {
    const nextStatus = attendee.status === 'Checked In' ? 'Pending' : 'Checked In';
    
    // Animate local state update immediately
    setAttendees(prev => prev.map(a => {
      if (a.id === attendee.id) {
        return { ...a, status: nextStatus };
      }
      return a;
    }));

    toast.success(`${attendee.fullName} successfully ${nextStatus === 'Checked In' ? 'checked in!' : 'marked pending.'}`);

    // If it's a real ticket, write to Firestore
    if (!attendee.isMock) {
      try {
        const ticketRef = doc(db, "tickets", attendee.id);
        const statusVal = nextStatus === 'Checked In' ? 'checked-in' : 'active';
        await updateDoc(ticketRef, { status: statusVal, updatedAt: serverTimestamp() });
      } catch (err) {
        console.error("Firestore check-in save failed:", err);
      }
    }
  };

  // Filter logic
  const filteredAttendees = useMemo(() => {
    return attendees.filter(att => {
      const matchesSearch = 
        att.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEvent = selectedEventId === 'all' || att.eventId === selectedEventId;
      const matchesStatus = selectedStatus === 'all' || att.status === selectedStatus;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [attendees, searchQuery, selectedEventId, selectedStatus]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredAttendees.length;
    const checkedIn = filteredAttendees.filter(a => a.status === 'Checked In').length;
    const pending = filteredAttendees.filter(a => a.status === 'Pending').length;
    const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    
    return { total, checkedIn, pending, rate };
  }, [filteredAttendees]);

  // Export filtered attendees to CSV
  const handleExportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.warning("No attendees to export.");
      return;
    }

    const headers = ['Ticket ID', 'Name', 'Email', 'Phone', 'Event Title', 'Ticket Type', 'Price', 'Registration Date', 'Status'];
    const rows = filteredAttendees.map(att => [
      att.id,
      att.fullName,
      att.email,
      att.phone,
      att.eventTitle.replace(/,/g, ' '), // sanitize commas
      att.ticketType,
      `$${att.price}`,
      att.registeredAt,
      att.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully!");
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--color-text-primary)' }}>Attendee Management</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
              Check-in registrants, review booking statuses, and manage attendee reports.
            </p>
          </div>

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
                <span style={{ fontWeight: 'bold' }}>Demo Mode Active:</span> Showing simulated attendees for your platform events.
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div className="skeleton-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stat Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              
              {/* Stat card: Total Registered */}
              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--color-glass-border)' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.75rem', borderRadius: '10px' }}>
                  <FiUsers size={24} />
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Total Registered</span>
                  <h4 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', fontWeight: '700' }}>{stats.total}</h4>
                </div>
              </div>

              {/* Stat card: Checked In */}
              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--color-glass-border)' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.75rem', borderRadius: '10px' }}>
                  <FiCheckSquare size={24} />
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Checked In</span>
                  <h4 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', fontWeight: '700' }}>{stats.checkedIn}</h4>
                </div>
              </div>

              {/* Stat card: Pending Check-ins */}
              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--color-glass-border)' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.75rem', borderRadius: '10px' }}>
                  <FiCalendar size={24} />
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Pending Check-ins</span>
                  <h4 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', fontWeight: '700' }}>{stats.pending}</h4>
                </div>
              </div>

              {/* Stat card: Attendance Rate */}
              <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--color-glass-border)' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '0.75rem', borderRadius: '10px' }}>
                  <FiCheck size={24} />
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Attendance Rate</span>
                  <h4 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', fontWeight: '700' }}>{stats.rate}%</h4>
                </div>
              </div>

            </div>

            {/* Main Interactive Controls & List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', border: '1px solid var(--color-glass-border)' }}>
              
              {/* Filter Panel */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', border: '1px solid var(--color-glass-border)', borderRadius: '10px', padding: '0.5rem 0.75rem', flex: 1, minWidth: '260px' }}>
                  <FiSearch color="var(--color-text-secondary)" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name, email or ticket ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Event Dropdown Filter */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', border: '1px solid var(--color-glass-border)', borderRadius: '10px', padding: '0.5rem 0.75rem', minWidth: '200px' }}>
                  <FiTag color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
                  <select 
                    value={selectedEventId} 
                    onChange={(e) => setSelectedEventId(e.target.value)} 
                    style={{ background: 'none', border: 'none', outline: 'none', width: '100%', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="all" style={{color: 'black'}}>All My Events</option>
                    {userEvents.map(ev => (
                      <option key={ev.id} value={ev.id} style={{color: 'black'}}>
                        {ev.title.length > 25 ? ev.title.substring(0, 22) + '...' : ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Dropdown Filter */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', border: '1px solid var(--color-glass-border)', borderRadius: '10px', padding: '0.5rem 0.75rem', minWidth: '150px' }}>
                  <FiFilter color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)} 
                    style={{ background: 'none', border: 'none', outline: 'none', width: '100%', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="all" style={{color: 'black'}}>All Statuses</option>
                    <option value="Checked In" style={{color: 'black'}}>Checked In</option>
                    <option value="Pending" style={{color: 'black'}}>Pending</option>
                    <option value="Cancelled" style={{color: 'black'}}>Cancelled</option>
                  </select>
                </div>

                {/* Export Button */}
                <button 
                  onClick={handleExportCSV}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
                >
                  <FiDownload size={18} /> Export CSV
                </button>

              </div>

              {/* Attendee Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem' }}>Ticket ID</th>
                      <th style={{ padding: '1rem' }}>Attendee</th>
                      <th style={{ padding: '1rem' }}>Event</th>
                      <th style={{ padding: '1rem' }}>Ticket Info</th>
                      <th style={{ padding: '1rem' }}>Reg. Date</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredAttendees.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <FiUsers size={32} />
                              <span>No attendees found matching filter criteria.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAttendees.map((att) => (
                          <motion.tr 
                            key={att.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.03)', 
                              fontSize: '0.9rem',
                              transition: 'background 0.2s'
                            }}
                            className="hover-bg"
                          >
                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                              {att.id.substring(0, 12)}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{att.fullName}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{att.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.eventTitle}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '500' }}>{att.ticketType}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                                  {att.price > 0 ? `$${att.price}` : 'Free'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                              {att.registeredAt}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                display: 'inline-block',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                border: '1px solid',
                                background: 
                                  att.status === 'Checked In' ? 'rgba(16, 185, 129, 0.1)' : 
                                  att.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: 
                                  att.status === 'Checked In' ? '#10B981' : 
                                  att.status === 'Pending' ? '#F59E0B' : '#EF4444',
                                borderColor: 
                                  att.status === 'Checked In' ? 'rgba(16, 185, 129, 0.3)' : 
                                  att.status === 'Pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                              }}>
                                {att.status}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                {att.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleCheckInToggle(att)}
                                    style={{
                                      background: att.status === 'Checked In' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                      color: att.status === 'Checked In' ? '#EF4444' : '#10B981',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.4rem 0.75rem',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    {att.status === 'Checked In' ? (
                                      <>
                                        <FiX size={14} /> Undo Check-in
                                      </>
                                    ) : (
                                      <>
                                        <FiCheck size={14} /> Check In
                                      </>
                                    )}
                                  </button>
                                )}
                                <a 
                                  href={`mailto:${att.email}`}
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text-secondary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.4rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none'
                                  }}
                                  title="Contact Attendee"
                                >
                                  <FiMail size={16} />
                                </a>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendees;
