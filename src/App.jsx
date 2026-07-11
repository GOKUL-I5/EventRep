import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import SplashLoader from './components/SplashLoader';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import PageTransition from './components/PageTransition';

import './index.css';

// Lazy-loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ManageEvents = lazy(() => import('./pages/ManageEvents'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventDiscovery = lazy(() => import('./pages/EventDiscovery'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const StaticAdminDashboard = lazy(() => import('./pages/StaticAdminDashboard'));
const Attendees = lazy(() => import('./pages/Attendees'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Lazy-loaded Admin Pages
import AdminRoute from './components/AdminRoute';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageGlobalEvents = lazy(() => import('./pages/admin/ManageGlobalEvents'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));



const AnimatedRoutes = () => {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Auth /></PageTransition>} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <PageTransition><Dashboard /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tickets" 
            element={
              <ProtectedRoute>
                <PageTransition><MyTickets /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <PageTransition><Profile /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/explore" 
            element={
              <ProtectedRoute>
                <PageTransition><EventDiscovery /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events/:id" 
            element={<PageTransition><EventDetails /></PageTransition>} 
          />
          <Route 
            path="/attendees" 
            element={
              <ProtectedRoute>
                <PageTransition><Attendees /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <PageTransition><Analytics /></PageTransition>
              </ProtectedRoute>
            } 
          />
          
          {/* --- ADMIN ROUTES --- */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <PageTransition><AdminDashboard /></PageTransition>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <PageTransition><ManageUsers /></PageTransition>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/events" 
            element={
              <AdminRoute>
                <PageTransition><ManageGlobalEvents /></PageTransition>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <AdminRoute>
                <PageTransition><SystemSettings /></PageTransition>
              </AdminRoute>
            } 
          />

          <Route 
            path="/events/manage" 
            element={
              <ProtectedRoute>
                <PageTransition><ManageEvents /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events/create" 
            element={
              <ProtectedRoute>
                <PageTransition><CreateEvent /></PageTransition>
              </ProtectedRoute>
            } 
          />
          <Route path="/static-admin" element={<PageTransition><StaticAdminDashboard /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for Splash screen
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {loading ? <SplashLoader key="loader" /> : null}
        </AnimatePresence>
        {!loading && (
          <>
            <AnimatedRoutes />
            <ToastContainer theme="dark" position="bottom-right" />
          </>
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;
