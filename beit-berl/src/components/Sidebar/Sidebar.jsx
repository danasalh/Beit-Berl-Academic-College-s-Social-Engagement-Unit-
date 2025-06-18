// components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { HiMenu, HiX, HiHome, HiUserGroup, HiOfficeBuilding, HiBell, HiCog, HiLogout } from 'react-icons/hi';
import AreYouSure from '../PopUps/AreYouSure/AreYouSure';
import './Sidebar.css';

const Sidebar = ({ userRole, userName }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for confirmation popup
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if mobile view and set sidebar closed by default on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  // Show the confirmation popup instead of directly logging out
  const initiateLogout = () => {
    setShowLogoutConfirm(true);
  };
  
  // Actual logout function called when user confirms
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Cancel logout function
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  // Navigation links based on user role
  const getNavLinks = () => {
    switch(userRole) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'דף הבית', icon: <HiHome size={20} /> },
          { path: '/admin/search', label: 'ניהול משתמשים', icon: <HiUserGroup size={20} /> },
          { path: '/admin/organizations', label: 'ניהול ארגונים', icon: <HiOfficeBuilding size={20} /> },
          { path: '/admin/notifications', label: 'התראות', icon: <HiBell size={20} /> },
          { path: '/admin/settings', label: 'הגדרות', icon: <HiCog size={20} /> },
        ];
      case 'orgRep':
        return [
          { path: '/orgRep/dashboard', label: 'דף הבית', icon: <HiHome size={20} /> },
          { path: '/orgRep/organization', label: 'הארגון שלי', icon: <HiOfficeBuilding size={20} /> },
          { path: '/orgRep/notifications', label: 'התראות', icon: <HiBell size={20} /> },
          { path: '/orgRep/settings', label: 'הגדרות', icon: <HiCog size={20} /> },
        ];
      case 'vc':
        return [
          { path: '/vc/dashboard', label: 'דף הבית', icon: <HiHome size={20} /> },
          { path: '/vc/organization', label: 'הארגון שלי', icon: <HiOfficeBuilding size={20} /> },
          { path: '/vc/notifications', label: 'התראות', icon: <HiBell size={20} /> },
          { path: '/vc/settings', label: 'הגדרות', icon: <HiCog size={20} /> },
        ];
      case 'volunteer':
        return [
          { path: '/volunteer/dashboard', label: 'דף הבית', icon: <HiHome size={20} /> },
          { path: '/volunteer/organizations', label: 'ארגונים', icon: <HiOfficeBuilding size={20} /> },
          { path: '/volunteer/notifications', label: 'התראות', icon: <HiBell size={20} /> },
          { path: '/volunteer/settings', label: 'הגדרות', icon: <HiCog size={20} /> },
        ];
      default:
        return [];
    }
  };
  
  return (
    <>
      {/* Mobile toggle button - only visible on mobile when sidebar is closed */}
      {isMobile && !isOpen && (
        <button 
          className="sidebar-toggle-mobile"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <HiMenu size={24} />
        </button>
      )}
    
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-content">
          
          {/* App logo/title with close button when open */}
          <div className="sidebar-header">
            {isOpen ? (
              <div className="app-title">
                <button 
                  className="sidebar-close-button"
                  onClick={toggleSidebar}
                  aria-label="Close menu"
                >
                  <HiX size={20} />
                </button>
              </div>
            ) : (
              <div className="app-icon" onClick={toggleSidebar}>
                <div className="icon-container">
                  <HiMenu size={24} />
                </div>
              </div>
            )}
          </div>
          
          {/* User greeting */}
          <div className="user-greeting">
            שלום <span className="user-name-sidebar">{userName}</span>
          </div>
          
          {/* Navigation links */}
          <nav className="sidebar-nav">
            <ul>
              {getNavLinks().map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      title={link.label}
                    >
                      <span className={`nav-icon ${isActive ? 'active' : ''}`}>{link.icon}</span>
                      {isOpen && <span className="nav-label">{link.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Logout button */}
          <button
            onClick={initiateLogout} // Changed to initiateLogout instead of handleLogout
            className="logout-button"
          >
            <span className="nav-icon"><HiLogout size={20} /></span>
            {isOpen && <span className="nav-label">התנתקות</span>}
          </button>
        </div>
      </div>
      
      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <AreYouSure
          message="האם אתה בטוח שברצונך להתנתק?"
          onConfirm={handleLogout}
          onCancel={cancelLogout}
        />
      )}
      
      {/* Overlay for mobile - close sidebar when clicking outside */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;