import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiUsers, FiCalendar, FiDollarSign, FiActivity } from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    estimatedRevenue: 0
  });
  const [chartData, setChartData] = useState({
    revenue: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const eventsSnap = await getDocs(collection(db, "events"));
        const ticketsSnap = await getDocs(collection(db, "tickets"));
        
        let rev = 0;
        const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const categoryCounts = {};
        
        ticketsSnap.docs.forEach(ticketDoc => {
          const t = ticketDoc.data();
          if (t.status === 'active') {
            const ev = eventsData.find(e => e.id === t.eventId);
            if (ev && ev.price) {
              rev += Number(ev.price);
            }
          }
        });

        eventsData.forEach(ev => {
          categoryCounts[ev.category] = (categoryCounts[ev.category] || 0) + 1;
        });

        const categoryData = Object.keys(categoryCounts).map(key => ({
          name: key,
          value: categoryCounts[key]
        }));

        // Mock revenue data for the chart since we don't have historical months
        const mockRevenueData = [
          { name: 'Jan', revenue: 4000, tickets: 240 },
          { name: 'Feb', revenue: 3000, tickets: 139 },
          { name: 'Mar', revenue: 5000, tickets: 380 },
          { name: 'Apr', revenue: 2780, tickets: 190 },
          { name: 'May', revenue: 8900, tickets: 480 },
          { name: 'Jun', revenue: rev, tickets: ticketsSnap.size } // Current month is actual
        ];

        setStats({
          totalUsers: usersSnap.size,
          totalEvents: eventsSnap.size,
          totalTickets: ticketsSnap.size,
          estimatedRevenue: rev
        });
        
        setChartData({
          revenue: mockRevenueData,
          categories: categoryData.length > 0 ? categoryData : [{ name: 'None', value: 1 }]
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <DashboardLayout><div style={{ padding: '4rem', textAlign: 'center' }}>Loading Admin Stats...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Admin Dashboard</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <StatCard icon={<FiUsers />} title="Total Users" value={stats.totalUsers} color="var(--color-accent)" />
          <StatCard icon={<FiCalendar />} title="Total Events" value={stats.totalEvents} color="var(--color-success)" />
          <StatCard icon={<FiActivity />} title="Total Tickets Sold" value={stats.totalTickets} color="#f59e0b" />
          <StatCard icon={<FiDollarSign />} title="Est. Platform Revenue" value={`$${stats.estimatedRevenue}`} color="var(--color-danger)" />
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Revenue Overview</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                  <YAxis stroke="var(--color-text-secondary)" />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Events by Category</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categories}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-glass-border)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Welcome to the Control Center</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Use the sidebar to manage users, moderate events, and adjust system settings. Role-based access ensures only authorized administrators can view this data.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const StatCard = ({ icon, title, value, color }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `color-mix(in srgb, ${color} 15%, transparent)`, color: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.75rem' }}>
      {icon}
    </div>
    <div>
      <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{title}</span>
      <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: '700' }}>{value}</span>
    </div>
  </div>
);

export default AdminDashboard;
