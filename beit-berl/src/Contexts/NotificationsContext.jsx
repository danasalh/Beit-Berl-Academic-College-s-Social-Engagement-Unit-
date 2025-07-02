// src/contexts/NotificationsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection reference
  const notificationsCollection = collection(db, 'notifications');

  // Helper function to convert Firestore document to notification object
  const convertDocToNotification = useCallback((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Convert Firestore timestamp to JavaScript Date
    date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date,
    // Ensure title is included (with fallback if not present in older documents)
    title: doc.data().title || 'Notification'
  }), []);

  // Real-time listener for notifications by receiver
  const subscribeToNotificationsByReceiver = useCallback((receiverId, callback) => {
    
    const q = query(
      notificationsCollection, 
      where('receiverId', '==', receiverId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs.map(convertDocToNotification);
        callback(notificationsData);
      },
      (error) => {
        console.error('❌ Error in real-time listener:', error);
        setError(error.message);
      }
    );

    return unsubscribe;
  }, [convertDocToNotification]);

  // Get all notifications
  const getNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(notificationsCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      
      setNotifications(notificationsData);
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // Get notifications for a specific receiver
  const getNotificationsByReceiver = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        notificationsCollection, 
        where('receiverId', '==', receiverId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching notifications by receiver:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // Get unread notifications for a receiver
  const getUnreadNotificationsByReceiver = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        notificationsCollection, 
        where('receiverId', '==', receiverId),
        where('read', '==', false),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching unread notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // Get notifications by type (reminder, approval-needed, hours-status, volunteer-completed, etc.)
  const getNotificationsByType = useCallback(async (type, receiverId = null) => {
    setLoading(true);
    setError(null);

    try {
      let q;
      if (receiverId) {
        q = query(
          notificationsCollection,
          where('receiverId', '==', receiverId),
          where('type', '==', type),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          notificationsCollection,
          where('type', '==', type),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching notifications by type:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // Get notification by ID
  const getNotificationById = useCallback(async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
      
      if (notificationDoc.exists()) {
        const notificationData = convertDocToNotification(notificationDoc);
        return notificationData;
      } else {
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // Create new notification
  const createNotification = useCallback(async (notificationData) => {
    setLoading(true);
    setError(null);

    try {
      // Updated valid notification types to include volunteer-completed
      const validTypes = [
        'reminder', 
        'approval-needed', 
        'feedback-notification', 
        'welcome', 
        'hours-status',
        'volunteer-completed'
      ];
      
      if (!validTypes.includes(notificationData.type)) {
        throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate required fields
      if (!notificationData.receiverId) {
        throw new Error('receiverId is required');
      }
      if (!notificationData.title) {
        throw new Error('title is required');
      }
      if (!notificationData.content) {
        throw new Error('content is required');
      }

      // Convert date to Firestore timestamp if it's a Date object
      const dataToSave = {
        ...notificationData,
        date: notificationData.date instanceof Date ? Timestamp.fromDate(notificationData.date) : Timestamp.now(),
        read: false, // Default to unread
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(notificationsCollection, dataToSave);
      
      const newNotification = { 
        id: docRef.id, 
        ...notificationData,
        read: false,
        date: dataToSave.date.toDate(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true, updatedAt: new Date() }
          : notification
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as unread
  const markNotificationAsUnread = useCallback(async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: false,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false, updatedAt: new Date() }
          : notification
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error marking notification as unread:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark all notifications as read for a receiver
  const markAllNotificationsAsRead = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const unreadNotifications = await getUnreadNotificationsByReceiver(receiverId);
      
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          updatedAt: Timestamp.now()
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.receiverId === receiverId && !notification.read
          ? { ...notification, read: true, updatedAt: new Date() }
          : notification
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error marking all notifications as read:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUnreadNotificationsByReceiver]);

  // Update notification
  const updateNotification = useCallback(async (notificationId, notificationData) => {
    setLoading(true);
    setError(null);

    try {
      // Convert date to Firestore timestamp if it's a Date object
      const dataToUpdate = {
        ...notificationData,
        date: notificationData.date instanceof Date ? Timestamp.fromDate(notificationData.date) : notificationData.date,
        updatedAt: Timestamp.now()
      };

      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, dataToUpdate);
      
      // Update local state with proper date conversion
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { 
              ...notification, 
              ...notificationData,
              date: notificationData.date instanceof Date ? notificationData.date : notification.date,
              updatedAt: new Date() 
            }
          : notification
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error updating notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      return true;
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete all read notifications for a receiver
  const deleteAllReadNotifications = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const receiverNotifications = await getNotificationsByReceiver(receiverId);
      const readNotifications = receiverNotifications.filter(notification => notification.read);
      
      const deletePromises = readNotifications.map(notification => 
        deleteDoc(doc(db, 'notifications', notification.id))
      );

      await Promise.all(deletePromises);

      // Update local state
      setNotifications(prev => prev.filter(notification => 
        !(notification.receiverId === receiverId && notification.read)
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error deleting read notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getNotificationsByReceiver]);

  // Get notification count by receiver
  const getNotificationCount = useCallback(async (receiverId, unreadOnly = false) => {
    
    try {
      let notifications;
      if (unreadOnly) {
        notifications = await getUnreadNotificationsByReceiver(receiverId);
      } else {
        notifications = await getNotificationsByReceiver(receiverId);
      }
      
      const count = notifications.length;
      return count;
    } catch (err) {
      console.error('❌ Error getting notification count:', err);
      throw err;
    }
  }, [getUnreadNotificationsByReceiver, getNotificationsByReceiver]);

  // Search notifications by title or content
  const searchNotifications = useCallback(async (searchTerm, receiverId = null) => {
    setLoading(true);
    setError(null);

    try {
      let notifications;
      if (receiverId) {
        notifications = await getNotificationsByReceiver(receiverId);
      } else {
        notifications = await getNotifications();
      }

      // Filter notifications based on search term (case-insensitive)
      const filteredNotifications = notifications.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filteredNotifications;
    } catch (err) {
      console.error('❌ Error searching notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getNotificationsByReceiver, getNotifications]);

  // Get hours-status notifications for a receiver
  const getHoursStatusNotifications = useCallback(async (receiverId) => {
    return await getNotificationsByType('hours-status', receiverId);
  }, [getNotificationsByType]);

  // Get unread hours-status notifications for a receiver
  const getUnreadHoursStatusNotifications = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        notificationsCollection,
        where('receiverId', '==', receiverId),
        where('type', '==', 'hours-status'),
        where('read', '==', false),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching unread hours-status notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  // NEW: Get volunteer-completed notifications for a receiver (typically admins)
  const getVolunteerCompletedNotifications = useCallback(async (receiverId) => {
    return await getNotificationsByType('volunteer-completed', receiverId);
  }, [getNotificationsByType]);

  // NEW: Get unread volunteer-completed notifications for a receiver
  const getUnreadVolunteerCompletedNotifications = useCallback(async (receiverId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        notificationsCollection,
        where('receiverId', '==', receiverId),
        where('type', '==', 'volunteer-completed'),
        where('read', '==', false),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(convertDocToNotification);
      
      return notificationsData;
    } catch (err) {
      console.error('❌ Error fetching unread volunteer-completed notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertDocToNotification]);

  const value = {
    notifications,
    loading,
    error,
    getNotifications,
    getNotificationsByReceiver,
    getUnreadNotificationsByReceiver,
    getNotificationsByType,
    getNotificationById,
    createNotification,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    updateNotification,
    deleteNotification,
    deleteAllReadNotifications,
    getNotificationCount,
    searchNotifications,
    subscribeToNotificationsByReceiver,
    // Hours-status specific methods
    getHoursStatusNotifications,
    getUnreadHoursStatusNotifications,
    // NEW: Volunteer-completed specific methods
    getVolunteerCompletedNotifications,
    getUnreadVolunteerCompletedNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};