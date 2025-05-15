// App.jsx with Added Password Reset Routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';

// Import Sidebar component
import Sidebar from "./components/Sidebar/Sidebar";

// Import your components for each route
// Admin pages
import AdminDashboard from './components/pages/admin/Dashboard/AdminDashboard';
import AdminSearch from './components/pages/admin/Search/AdminSearch';
import AdminOrganizations from './components/pages/admin/Organizations/AdminOrganizations';
import AdminNotifications from './components/pages/admin/Notifications/AdminNotifications';
import AdminSettings from './components/pages/admin/Settings/AdminSettings';
// OrgRep pages
import OrgRepDashboard from './components/pages/orgRep/Dashboard/OrgRepDashboard';
import OrgRepOrganization from './components/pages/orgRep/Organization/OrgRepOrganization';
import OrgRepNotifications from './components/pages/orgRep/Notifications/OrgRepNotifications';
import OrgRepSettings from './components/pages/orgRep/Settings/OrgRepSettings';
// VC pages
import VcDashboard from './components/pages/vc/Dashboard/VcDashboard';
import VcOrganization from './components/pages/vc/Organization/VcOrganization';
import VcNotifications from './components/pages/vc/Notifications/VcNotifications';
import VcSettings from './components/pages/vc/Settings/VcSettings';
// Volunteer pages
import VolunteerDashboard from './components/pages/volunteer/Dashboard/VolunteerDashboard';
import VolunteerOrganizations from './components/pages/volunteer/Organizations/VolunteerOrganizations';
import VolunteerNotifications from './components/pages/volunteer/Notifications/VolunteerNotifications';
import VolunteerSettings from './components/pages/volunteer/Settings/VolunteerSettings';
// Auth pages
import Login from './components/pages/auth/Login/Login';
import Register from './components/pages/auth/Register/Register';
// Password Reset Pages
import ForgotPassword from './components/pages/auth/ForgotPassword/ForgotPassword';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
  // Using the imported auth and db instances from config file
  const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      setUser(authUser);
      // Get user role from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserName(userData.name || authUser.displayName);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      setUser(null);
      setUserRole(null);
      setUserName('');
    }
    setLoading(false);
  });
  
  return () => unsubscribe();
}, []);
  
  // Protected route component with layout
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" />;
      if (userRole === 'orgRep') return <Navigate to="/orgRep/dashboard" />;
      if (userRole === 'vc') return <Navigate to="/vc/dashboard" />;
      if (userRole === 'volunteer') return <Navigate to="/volunteer/dashboard" />;
      return <Navigate to="/login" />;
    }
    
    return (
      <div className="flex h-screen bg-gray-100">
        {/* Show sidebar for authenticated users */}
        <Sidebar userRole={userRole} userName={userName} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto transition-all ml-0 md:ml-16">
          {children}
        </main>
      </div>
    );
  };
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          user ? (
            userRole === 'admin' ? <Navigate to="/admin/dashboard" /> :
            userRole === 'orgRep' ? <Navigate to="/orgRep/dashboard" /> :
            userRole === 'vc' ? <Navigate to="/vc/dashboard" /> :
            userRole === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
            <Login />
          ) : <Login />
        } />
        <Route path="/register" element={
          user ? (
            userRole === 'admin' ? <Navigate to="/admin/dashboard" /> :
            userRole === 'orgRep' ? <Navigate to="/orgRep/dashboard" /> :
            userRole === 'vc' ? <Navigate to="/vc/dashboard" /> :
            userRole === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
            <Register />
          ) : <Register />
        } />
        
        {/* Password Reset Routes */}
        <Route path="/forgot-password" element={
          user ? (
            userRole === 'admin' ? <Navigate to="/admin/dashboard" /> :
            userRole === 'orgRep' ? <Navigate to="/orgRep/dashboard" /> :
            userRole === 'vc' ? <Navigate to="/vc/dashboard" /> :
            userRole === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
            <ForgotPassword />
          ) : <ForgotPassword />
        } />
        
        {/* Admin routes - only accessible to admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/search" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSearch />
          </ProtectedRoute>
        } />
        <Route path="/admin/organizations" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOrganizations />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } />
        
        {/* OrgRep routes - only accessible to orgRep */}
        <Route path="/orgRep/dashboard" element={
          <ProtectedRoute allowedRoles={['orgRep']}>
            <OrgRepDashboard />
          </ProtectedRoute>
        } />
        <Route path="/orgRep/organization" element={
          <ProtectedRoute allowedRoles={['orgRep']}>
            <OrgRepOrganization />
          </ProtectedRoute>
        } />
        <Route path="/orgRep/notifications" element={
          <ProtectedRoute allowedRoles={['orgRep']}>
            <OrgRepNotifications />
          </ProtectedRoute>
        } />
        <Route path="/orgRep/settings" element={
          <ProtectedRoute allowedRoles={['orgRep']}>
            <OrgRepSettings />
          </ProtectedRoute>
        } />
        
        {/* VC routes - only accessible to vc */}
        <Route path="/vc/dashboard" element={
          <ProtectedRoute allowedRoles={['vc']}>
            <VcDashboard />
          </ProtectedRoute>
        } />
        <Route path="/vc/organization" element={
          <ProtectedRoute allowedRoles={['vc']}>
            <VcOrganization />
          </ProtectedRoute>
        } />
        <Route path="/vc/notifications" element={
          <ProtectedRoute allowedRoles={['vc']}>
            <VcNotifications />
          </ProtectedRoute>
        } />
        <Route path="/vc/settings" element={
          <ProtectedRoute allowedRoles={['vc']}>
            <VcSettings />
          </ProtectedRoute>
        } />
        
        {/* Volunteer routes - only accessible to volunteer */}
        <Route path="/volunteer/dashboard" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/volunteer/organizations" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerOrganizations />
          </ProtectedRoute>
        } />
        <Route path="/volunteer/notifications" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerNotifications />
          </ProtectedRoute>
        } />
        <Route path="/volunteer/settings" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerSettings />
          </ProtectedRoute>
        } />
        
        {/* Default route - redirect based on role or to login */}
        <Route path="*" element={
          loading ? <div>Loading...</div> :
          !user ? <Navigate to="/login" /> :
          userRole === 'admin' ? <Navigate to="/admin/dashboard" /> :
          userRole === 'orgRep' ? <Navigate to="/orgRep/dashboard" /> :
          userRole === 'vc' ? <Navigate to="/vc/dashboard" /> :
          userRole === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
          <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;