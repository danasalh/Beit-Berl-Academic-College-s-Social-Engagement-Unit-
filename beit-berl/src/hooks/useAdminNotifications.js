// src/hooks/useAdminNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../Contexts/NotificationsContext';
import { useUsers } from '../Contexts/UsersContext';

export const useAdminNotifications = () => {
  const { 
    getNotificationsByReceiver, 
    getUnreadNotificationsByReceiver,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationCount 
  } = useNotifications();
  
  const { currentUser } = useUsers();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Fetch notifications for current admin user
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [allNotifications, unreadNotifications] = await Promise.all([
        getNotificationsByReceiver(String(currentUser.id)),
        getUnreadNotificationsByReceiver(String(currentUser.id))
      ]);

      setNotifications(allNotifications || []);
      setUnreadCount(unreadNotifications?.length || 0);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, isAdmin, getNotificationsByReceiver, getUnreadNotificationsByReceiver]);

  // Get only feedback notifications
  const getFeedbackNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'feedback-notification'
    );
  }, [notifications]);

  // Get unread feedback notifications
  const getUnreadFeedbackNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.type === 'feedback-notification' && !notification.read
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
    if (!currentUser?.id || !isAdmin) return;

    try {
      await markAllNotificationsAsRead(String(currentUser.id));
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [currentUser?.id, isAdmin, markAllNotificationsAsRead]);

  // Get notification count
  const getCount = useCallback(async (unreadOnly = false) => {
    if (!currentUser?.id || !isAdmin) return 0;

    try {
      return await getNotificationCount(String(currentUser.id), unreadOnly);
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }, [currentUser?.id, isAdmin, getNotificationCount]);

  // Auto-refresh notifications when user logs in or role changes
  useEffect(() => {
    if (isAdmin && currentUser?.id) {
      fetchNotifications();
    }
  }, [fetchNotifications, isAdmin, currentUser?.id]);

  // Set up interval to check for new notifications (optional)
  useEffect(() => {
    if (!isAdmin || !currentUser?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications, isAdmin, currentUser?.id]);

  return {
    // Data
    notifications,
    unreadCount,
    loading,
    error,
    isAdmin,
    
    // Methods
    fetchNotifications,
    getFeedbackNotifications,
    getUnreadFeedbackNotifications,
    markAsRead,
    markAllAsRead,
    getCount,
    
    // Computed values
    hasUnreadNotifications: unreadCount > 0,
    feedbackNotifications: getFeedbackNotifications(),
    unreadFeedbackNotifications: getUnreadFeedbackNotifications()
  };
};