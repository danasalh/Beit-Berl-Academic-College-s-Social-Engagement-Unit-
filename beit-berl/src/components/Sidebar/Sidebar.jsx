// components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
// Import icons - if you don't have react-icons installed, you can replace these with simple text or install the package
import { HiMenu, HiX, HiHome, HiSearch, HiOfficeBuilding, HiBell, HiCog, HiLogout } from 'react-icons/hi';

const Sidebar = ({ userRole, userName }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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
  
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Navigation links based on user role
  const getNavLinks = () => {
    switch(userRole) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: <HiHome size={20} /> },
          { path: '/admin/search', label: 'Search', icon: <HiSearch size={20} /> },
          { path: '/admin/organizations', label: 'Organizations', icon: <HiOfficeBuilding size={20} /> },
          { path: '/admin/notifications', label: 'Notifications', icon: <HiBell size={20} /> },
          { path: '/admin/settings', label: 'Settings', icon: <HiCog size={20} /> },
        ];
      case 'orgRep':
        return [
          { path: '/orgRep/dashboard', label: 'Dashboard', icon: <HiHome size={20} /> },
          { path: '/orgRep/organization', label: 'Organization', icon: <HiOfficeBuilding size={20} /> },
          { path: '/orgRep/notifications', label: 'Notifications', icon: <HiBell size={20} /> },
          { path: '/orgRep/settings', label: 'Settings', icon: <HiCog size={20} /> },
        ];
      case 'vc':
        return [
          { path: '/vc/dashboard', label: 'Dashboard', icon: <HiHome size={20} /> },
          { path: '/vc/organization', label: 'Organization', icon: <HiOfficeBuilding size={20} /> },
          { path: '/vc/notifications', label: 'Notifications', icon: <HiBell size={20} /> },
          { path: '/vc/settings', label: 'Settings', icon: <HiCog size={20} /> },
        ];
      case 'volunteer':
        return [
          { path: '/volunteer/dashboard', label: 'Dashboard', icon: <HiHome size={20} /> },
          { path: '/volunteer/organizations', label: 'Organizations', icon: <HiOfficeBuilding size={20} /> },
          { path: '/volunteer/notifications', label: 'Notifications', icon: <HiBell size={20} /> },
          { path: '/volunteer/settings', label: 'Settings', icon: <HiCog size={20} /> },
        ];
      default:
        return [];
    }
  };
  
  return (
    <>
      {/* Mobile toggle button - shown only on mobile */}
      <button 
        className={`md:hidden fixed top-4 ${isOpen ? 'left-64' : 'left-4'} z-20 p-2 rounded-md bg-blue-600 text-white`}
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
      </button>
    
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-10
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0 -translate-x-full md:translate-x-0 md:w-16'}
        bg-gray-800 text-white
        flex flex-col
      `}>
        {/* When collapsed on desktop, show mini icons only */}
        <div className={`overflow-hidden ${isOpen ? 'p-4' : 'p-2'} h-full flex flex-col`}>
          {/* App logo/name */}
          <div className="mb-6 font-bold text-xl flex items-center justify-center">
            {isOpen ? 'YourApp' : 'YA'}
          </div>
          
          {/* User greeting */}
          <div className={`mb-6 ${isOpen ? 'px-4' : 'px-1'} py-2`}>
            {isOpen ? (
              <p className="text-sm">Hello, {userName || 'User'}</p>
            ) : (
              <p className="text-center text-sm">{userName?.charAt(0) || 'U'}</p>
            )}
          </div>
          
          {/* Navigation links */}
          <nav className="flex-1">
            <ul>
              {getNavLinks().map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path} className="mb-2">
                    <button
                      onClick={() => navigate(link.path)}
                      className={`
                        w-full text-left rounded
                        ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}
                        ${isOpen ? 'px-4 py-2' : 'p-2'}
                        flex items-center
                      `}
                    >
                      {link.icon}
                      {isOpen && <span className="ml-3">{link.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`
              mt-auto w-full rounded
              ${isOpen ? 'px-4 py-2' : 'p-2'}
              text-left hover:bg-red-700
              flex items-center
            `}
          >
            <HiLogout size={20} />
            {isOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile - close sidebar when clicking outside */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;