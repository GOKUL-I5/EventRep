import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiHome, FiCalendar, FiBarChart2, FiBookOpen, FiUsers, FiSettings,
  FiSearch, FiBell, FiMoreVertical, FiEdit2, FiTrash2, FiEye
} from 'react-icons/fi';

// ----------------------
// DUMMY DATA
// ----------------------
const dummyEvents = [
  {
    id: 1,
    title: "Global Music Concert 2026",
    category: "Music Concert",
    date: "2026-07-15",
    time: "18:00",
    location: "Mumbai, India",
    organizer: "LiveNation",
    price: 1500,
    availableSeats: 450,
    status: "Upcoming",
    description: "An unforgettable evening of live music featuring top global artists.",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80"
  },
  {
    id: 2,
    title: "AI & Future Tech Summit",
    category: "Tech Conference",
    date: "2026-06-24", // Today for Live
    time: "09:00",
    location: "Bengaluru, India",
    organizer: "TechCorp",
    price: 3000,
    availableSeats: 120,
    status: "Live",
    description: "Deep dive into Artificial Intelligence and the future of computing.",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80"
  },
  {
    id: 3,
    title: "Startup Founders Meetup",
    category: "Startup Meetup",
    date: "2026-06-25",
    time: "17:00",
    location: "Delhi, India",
    organizer: "IncubateHub",
    price: 0,
    availableSeats: 50,
    status: "Upcoming",
    description: "Network with leading founders and angel investors.",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80"
  },
  {
    id: 4,
    title: "Annual Food Festival",
    category: "Food Festival",
    date: "2026-05-10",
    time: "10:00",
    location: "Chennai, India",
    organizer: "Taste Makers",
    price: 200,
    availableSeats: 0,
    status: "Completed",
    description: "Experience culinary delights from over 100 chefs.",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
  },
  {
    id: 5,
    title: "E-Sports Gaming Tournament",
    category: "Gaming Tournament",
    date: "2026-08-05",
    time: "11:00",
    location: "Hyderabad, India",
    organizer: "Gamers Alliance",
    price: 500,
    availableSeats: 200,
    status: "Upcoming",
    description: "Compete for a grand prize pool in top multiplayer games.",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
  },
  {
    id: 6,
    title: "National College Symposium",
    category: "College Symposium",
    date: "2026-09-12",
    time: "08:30",
    location: "Pune, India",
    organizer: "EduConnect",
    price: 150,
    availableSeats: 800,
    status: "Upcoming",
    description: "A gathering of brilliant minds presenting technical papers.",
    imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80"
  },
  {
    id: 7,
    title: "Photography Masterclass",
    category: "Workshop",
    date: "2026-04-20",
    time: "14:00",
    location: "Kochi, India",
    organizer: "LensCrafters",
    price: 1000,
    availableSeats: 0,
    status: "Completed",
    description: "Learn advanced photography techniques from professionals.",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
  },
  {
    id: 8,
    title: "Global Cultural Fest",
    category: "Cultural Fest",
    date: "2026-06-24", // Today for Live
    time: "18:00",
    location: "Kolkata, India",
    organizer: "Culture Vibes",
    price: 300,
    availableSeats: 20,
    status: "Live",
    description: "Celebrate diversity through art, music, and dance.",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"
  },
  {
    id: 9,
    title: "CXO Business Summit",
    category: "Business Summit",
    date: "2026-10-01",
    time: "09:00",
    location: "Mumbai, India",
    organizer: "BizLeaders",
    price: 5000,
    availableSeats: 150,
    status: "Upcoming",
    description: "Exclusive summit for C-level executives and entrepreneurs.",
    imageUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80"
  },
  {
    id: 10,
    title: "Winter Fashion Show",
    category: "Fashion Show",
    date: "2026-11-20",
    time: "19:00",
    location: "Delhi, India",
    organizer: "Vogue Events",
    price: 2500,
    availableSeats: 300,
    status: "Upcoming",
    description: "Showcasing the latest winter collections from top designers.",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80"
  },
  {
    id: 11,
    title: "City Marathon 2026",
    category: "Sports Event",
    date: "2026-12-05",
    time: "05:00",
    location: "Chennai, India",
    organizer: "Runners Club",
    price: 500,
    availableSeats: 1000,
    status: "Upcoming",
    description: "A full city marathon promoting health and wellness.",
    imageUrl: "https://images.unsplash.com/photo-1530143311094-34d807799e8f?w=800&q=80"
  },
  {
    id: 12,
    title: "Orphanage Charity Drive",
    category: "Charity Event",
    date: "2026-01-10",
    time: "10:00",
    location: "Coimbatore, India",
    organizer: "Helping Hands NGO",
    price: 0,
    availableSeats: 0,
    status: "Completed",
    description: "Charity drive focusing on providing books and clothes to children.",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"
  }
];

// ----------------------
// COMPONENTS
// ----------------------

const StatCard = ({ title, value, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}
  >
    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</span>
    <span style={{ color, fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.05em' }}>{value}</span>
  </motion.div>
);

const StaticAdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = {
    total: dummyEvents.length,
    live: dummyEvents.filter(e => e.status === 'Live').length,
    upcoming: dummyEvents.filter(e => e.status === 'Upcoming').length,
    completed: dummyEvents.filter(e => e.status === 'Completed').length,
  };

  const getCountdown = (dateString, timeString) => {
    const target = new Date(`${dateString}T${timeString}:00`);
    const diff = target - currentTime;
    if (diff <= 0) return "Started";
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2.5rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EventAdmin.
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { name: 'Dashboard', icon: FiHome, disabled: true },
            { name: 'Events', icon: FiCalendar, active: true },
            { name: 'Analytics', icon: FiBarChart2, disabled: true },
            { name: 'Bookings', icon: FiBookOpen, disabled: true },
            { name: 'Users', icon: FiUsers, disabled: true },
            { name: 'Settings', icon: FiSettings, disabled: true }
          ].map((item) => (
            <div 
              key={item.name}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px',
                background: item.active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: item.active ? '#fff' : (item.disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'),
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontWeight: item.active ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              <item.icon size={18} />
              {item.name}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Admin User</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>admin@events.com</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP NAV */}
        <div style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Events</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <FiSearch color="rgba(255,255,255,0.5)" />
              <input type="text" placeholder="Search events..." style={{ background: 'transparent', border: 'none', color: '#fff', marginLeft: '0.5rem', outline: 'none' }} />
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <FiBell size={20} color="rgba(255,255,255,0.7)" />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          
          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <StatCard title="Total Events" value={stats.total} color="#ffffff" />
            <StatCard title="Live Events" value={stats.live} color="#10b981" />
            <StatCard title="Upcoming Events" value={stats.upcoming} color="#3b82f6" />
            <StatCard title="Completed Events" value={stats.completed} color="#64748b" />
          </div>

          {/* EVENTS LIST */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>All Events</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {dummyEvents.map((event) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Banner */}
                <div style={{ position: 'relative', height: '180px' }}>
                  <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Status Badge */}
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                    {event.status === 'Live' && (
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', backdropFilter: 'blur(4px)' }}>
                        <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} /> Live Now
                      </span>
                    )}
                    {event.status === 'Upcoming' && (
                      <span style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                        Upcoming
                      </span>
                    )}
                    {event.status === 'Completed' && (
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                        Completed
                      </span>
                    )}
                  </div>
                  
                  {/* Category */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {event.category}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>{event.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: 'auto' }}>
                    <div><span style={{ color: '#fff' }}>Date:</span> {event.date}</div>
                    <div><span style={{ color: '#fff' }}>Time:</span> {event.time}</div>
                    <div><span style={{ color: '#fff' }}>Location:</span> {event.location.split(',')[0]}</div>
                    <div><span style={{ color: '#fff' }}>Seats:</span> {event.availableSeats} Left</div>
                  </div>

                  {/* Countdown Timer for Upcoming */}
                  {event.status === 'Upcoming' && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#3b82f6', fontWeight: '500' }}>
                      Starts in: {getCountdown(event.date, event.time)}
                    </div>
                  )}

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                      {event.price === 0 ? 'Free' : `₹${event.price}`}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <FiEye />
                      </button>
                      <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <FiEdit2 />
                      </button>
                      <button style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StaticAdminDashboard;
