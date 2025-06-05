import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBell } from 'react-icons/hi';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase/config';
import { useNotifications } from '../../../contexts/NotificationsContext';
import { useUsers } from '../../../contexts/UsersContext';
import './NotificationsBadge.css';

const NotificationsBadge = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get context functions and state
  const { getNotificationsByReceiver } = useNotifications();
  const { currentUser } = useUsers();
  
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

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.id) {
        setUnreadCount(0);
        return;
      }

      try {
        const userNotifications = await getNotificationsByReceiver(currentUser.id);
        
        // Count unread notifications
        const unreadNotifications = userNotifications.filter(notif => !notif.read);
        setUnreadCount(unreadNotifications.length);
        
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    
    // Check for updates more frequently
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [currentUser?.id, getNotificationsByReceiver]);

  // Also refresh when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser?.id) {
        // Refetch when page becomes visible
        const fetchUnreadCount = async () => {
          try {
            const userNotifications = await getNotificationsByReceiver(currentUser.id);
            const unreadNotifications = userNotifications.filter(notif => !notif.read);
            setUnreadCount(unreadNotifications.length);
          } catch (error) {
            console.error('Error fetching unread notifications count:', error);
          }
        };
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id, getNotificationsByReceiver]);

  // Refresh count when user navigates (focus event)
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser?.id) {
        const fetchUnreadCount = async () => {
          try {
            const userNotifications = await getNotificationsByReceiver(currentUser.id);
            const unreadNotifications = userNotifications.filter(notif => !notif.read);
            setUnreadCount(unreadNotifications.length);
          } catch (error) {
            console.error('Error fetching unread notifications count:', error);
          }
        };
        fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?.id, getNotificationsByReceiver]);
  
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
        {unreadCount > 0 && (
          <div className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsBadge;