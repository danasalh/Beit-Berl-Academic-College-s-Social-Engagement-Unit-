// src/hooks/useRoleBasedNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../Contexts/NotificationsContext';
import { useUsers } from '../Contexts/UsersContext';

export const useRoleBasedNotifications = () => {
  const { 
    getNotificationsByReceiver, 
    getUnreadNotificationsByReceiver,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationCount,
    subscribeToNotificationsByReceiver
  } = useNotifications();
  
  const { currentUser } = useUsers();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user ID consistently
  const getUserId = (user) => user?.id || user?.docId;
  const currentUserId = getUserId(currentUser);

  // Check user role
  const isAdmin = currentUser?.role === 'admin';
  const isOrgRep = currentUser?.role === 'orgRep';
  const isVC = currentUser?.role === 'vc';
  const isVolunteer = currentUser?.role === 'volunteer';

  // Fetch notifications for current user
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [allNotifications, unreadNotifications] = await Promise.all([
        getNotificationsByReceiver(String(currentUserId)),
        getUnreadNotificationsByReceiver(String(currentUserId))
      ]);

      setNotifications(allNotifications || []);
      setUnreadCount(unreadNotifications?.length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, getNotificationsByReceiver, getUnreadNotificationsByReceiver]);

  // Set up real-time listener
  useEffect(() => {
    if (!currentUserId) return;
    
    const unsubscribe = subscribeToNotificationsByReceiver(
      String(currentUserId),
      (notificationsData) => {
        setNotifications(notificationsData);
        
        // Update unread count
        const unreadNotifications = notificationsData.filter(n => !n.read);
        setUnreadCount(unreadNotifications.length);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, subscribeToNotificationsByReceiver]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get approval-needed notifications (for admins, orgReps, VCs)
  const getApprovalNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'approval-needed'
    );
  }, [notifications]);

  // Get unread approval notifications
  const getUnreadApprovalNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'approval-needed' && !notification.read
    );
  }, [notifications]);

  // Get feedback notifications (for admins)
  const getFeedbackNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'feedback-notification'
    );
  }, [notifications]);

  // Get reminder notifications (for volunteers)
  const getReminderNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'reminder'
    );
  }, [notifications]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [markNotificationAsRead]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;

    try {
      await markAllNotificationsAsRead(String(currentUserId));
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [currentUserId, markAllNotificationsAsRead]);

  // Get notification count
  const getCount = useCallback(async (unreadOnly = false) => {
    if (!currentUserId) return 0;

    try {
      return await getNotificationCount(String(currentUserId), unreadOnly);
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }, [currentUserId, getNotificationCount]);

  return {
    // Data
    notifications,
    unreadCount,
    loading,
    error,
    currentUserId,
    
    // User role checks
    isAdmin,
    isOrgRep,
    isVC,
    isVolunteer,
    
    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getCount,
    
    // Filtered notifications by type
    getNotificationsByType,
    getApprovalNotifications,
    getUnreadApprovalNotifications,
    getFeedbackNotifications,
    getReminderNotifications,
    
    // Computed values
    hasUnreadNotifications: unreadCount > 0,
    approvalNotifications: getApprovalNotifications(),
    unreadApprovalNotifications: getUnreadApprovalNotifications(),
    feedbackNotifications: getFeedbackNotifications(),
    reminderNotifications: getReminderNotifications()
  };
};