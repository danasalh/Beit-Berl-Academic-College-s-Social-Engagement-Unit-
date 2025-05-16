import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBell } from 'react-icons/hi';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase/config';
import './NotificationsBadge.css';

const NotificationsBadge = ({ count = 3 }) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  
  // Get user role on component mount
  useEffect(() => {
    const getUserRole = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        }
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };
    
    getUserRole();
  }, []);
  
  const handleClick = () => {
    // Navigate based on user role
    if (userRole === 'admin') {
      navigate('/admin/Notifications');
    } else if (userRole === 'orgRep') {
      navigate('/orgRep/Notifications');
    } else if (userRole === 'vc') {
      navigate('/vc/Notifications');
    } else if (userRole === 'volunteer') {
      navigate('/volunteer/notifications');
    } else {
      // Default fallback if role is unknown
      navigate('/notifications');
    }
  };

  return (
    <div className="notification-badge-container" onClick={handleClick}>
      <div className="notification-badge">
        <HiBell className="notification-icon" />
        
        {/* Notification Count Indicator */}
        {count > 0 && (
          <div className="notification-count">
            {count > 99 ? '99+' : count}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsBadge;