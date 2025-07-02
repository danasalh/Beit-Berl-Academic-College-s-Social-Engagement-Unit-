// src/contexts/FeedbackContext.jsx - Enhanced with Admin Notifications
import { createContext, useContext, useState, useCallback } from 'react';
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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUsers } from './UsersContext';

const FeedbackContext = createContext();

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
  const { getUserById } = useUsers();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection references
  const feedbackCollection = collection(db, 'feedback');
  const usersCollection = collection(db, 'users');
  const organizationsCollection = collection(db, 'organizations');
  const notificationsCollection = collection(db, 'notifications');

  // Helper function to get user details
  const getUserDetails = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', String(userId)));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  // Helper function to get organization details
  const getOrganizationDetails = async (orgId) => {
    try {
      // Try to find organization by custom ID field
      const q = query(organizationsCollection, where('id', '==', orgId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const orgDoc = querySnapshot.docs[0];
        return { firebaseId: orgDoc.id, ...orgDoc.data() };
      }

      // Fallback: try Firebase document ID
      const orgDoc = await getDoc(doc(db, 'organizations', String(orgId)));
      if (orgDoc.exists()) {
        return { firebaseId: orgDoc.id, ...orgDoc.data() };
      }

      return null;
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return null;
    }
  };

  // Helper function to get all admin users
  const getAdminUsers = async () => {
    try {
      const q = query(usersCollection, where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  };

  // Helper function to create notifications for admin users
  const createAdminNotifications = async (feedbackData, volunteerDetails, fromUserDetails, orgDetails) => {
    try {
      const adminUsers = await getAdminUsers();

      if (adminUsers.length === 0) {
        console.warn('No admin users found to notify');
        return;
      }

      // Get user details if not provided
      const [volunteer, fromUser] = await Promise.all([
        volunteerDetails || getUserById(feedbackData.volunteerId),
        fromUserDetails || getUserById(feedbackData.fromVCId)
      ]);

      // Get proper names with fallbacks
      const getDisplayName = (user) => {
        if (!user) return 'משתמש לא ידוע';
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || `משתמש ${user.id}`;
      };

      const volunteerName = getDisplayName(volunteer);
      const fromUserName = getDisplayName(fromUser);
      const orgName = orgDetails?.name || 'ארגון לא ידוע';

      // Create enhanced notification content
      const notificationContent = {
        text: `המשתמש ${fromUserName} הזין פידבק חדש עבור המתנדב ${volunteerName}`,
        timestamp: new Date().toLocaleString('he-IL'),
        details: 'ניתן לראות את הפידבק בפרופיל המתנדב.'
      };

      // Create notifications for all admin users
      const notificationPromises = adminUsers.map(admin => {
        const notificationData = {
          receiverId: String(admin.id),
          relatedId: String(feedbackData.volunteerId),
          type: 'feedback-notification',
          title: 'פידבק חדש במערכת',
          content: `${notificationContent.text} בתאריך ${notificationContent.timestamp}. ${notificationContent.details}`,
          date: Timestamp.now(),
          read: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          metadata: {
            feedbackId: feedbackData.id,
            volunteerId: feedbackData.volunteerId,
            volunteerName,
            fromUserId: feedbackData.fromVCId,
            fromUserName,
            orgId: fromUser?.orgId?.[0] || null,
            orgName
          }
        };

        return addDoc(notificationsCollection, notificationData);
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('❌ Error creating admin notifications:', error);
    }
  };

  // Get all feedback
  const getFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(feedbackCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JavaScript Date
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));

      setFeedback(feedbackData);
      return feedbackData;
    } catch (err) {
      console.error('❌ Error fetching feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get feedback by volunteer ID
  const getFeedbackByVolunteerId = useCallback(async (volunteerId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        feedbackCollection,
        where('volunteerId', '==', String(volunteerId)),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));

      return feedbackData;
    } catch (err) {
      console.error('❌ Error fetching feedback by volunteer:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get feedback by the user who created it
  const getFeedbackByFromVC = useCallback(async (fromVCId) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        feedbackCollection,
        where('fromVCId', '==', String(fromVCId)),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));

      return feedbackData;
    } catch (err) {
      console.error('❌ Error fetching feedback by fromVC:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new feedback with admin notifications
  const createFeedback = useCallback(async (feedbackData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!feedbackData.volunteerId) {
        throw new Error('volunteerId is required');
      }
      if (!feedbackData.fromVCId) {
        throw new Error('fromVCId is required');
      }
      if (!feedbackData.content) {
        throw new Error('content is required');
      }

      // Convert date to Firestore timestamp if it's a Date object
      const dataToSave = {
        ...feedbackData,
        volunteerId: String(feedbackData.volunteerId),
        fromVCId: String(feedbackData.fromVCId),
        date: feedbackData.date instanceof Date ? Timestamp.fromDate(feedbackData.date) : Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(feedbackCollection, dataToSave);

      const newFeedback = {
        id: docRef.id,
        ...feedbackData,
        volunteerId: String(feedbackData.volunteerId),
        fromVCId: String(feedbackData.fromVCId),
        date: dataToSave.date.toDate(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update local state
      setFeedback(prev => [newFeedback, ...prev]);

      // ENHANCED: Get user details for notifications (run in parallel with better error handling)
      const [volunteerDetails, fromUserDetails] = await Promise.all([
        getUserDetails(feedbackData.volunteerId).catch(err => {
          console.warn('⚠️ Could not fetch volunteer details:', err);
          return null;
        }),
        getUserDetails(feedbackData.fromVCId).catch(err => {
          console.warn('⚠️ Could not fetch fromUser details:', err);
          return null;
        })
      ]);

      // ENHANCED: Get organization details with better logic
      let orgDetails = null;
      if (fromUserDetails?.orgId) {
        // Handle both array and single value orgId
        const orgId = Array.isArray(fromUserDetails.orgId)
          ? fromUserDetails.orgId[0]
          : fromUserDetails.orgId;

        if (orgId) {
          orgDetails = await getOrganizationDetails(orgId).catch(err => {
            console.warn('⚠️ Could not fetch organization details:', err);
            return null;
          });
        }
      }

      // Create notifications for admin users (don't wait for it to complete)
      createAdminNotifications({
        ...newFeedback,
        id: docRef.id
      }, volunteerDetails, fromUserDetails, orgDetails);

      return newFeedback;
    } catch (err) {
      console.error('❌ Error creating feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update feedback
  const updateFeedback = useCallback(async (feedbackId, feedbackData) => {
    setLoading(true);
    setError(null);

    try {
      // Only include fields that are actually being updated
      const dataToUpdate = {
        ...feedbackData,
        updatedAt: Timestamp.now()
      };

      // Handle date field properly - only update if explicitly provided
      if (feedbackData.date !== undefined) {
        if (feedbackData.date instanceof Date) {
          dataToUpdate.date = Timestamp.fromDate(feedbackData.date);
        } else if (feedbackData.date && typeof feedbackData.date === 'object' && feedbackData.date.toDate) {
          // Already a Firestore timestamp
          dataToUpdate.date = feedbackData.date;
        } else if (feedbackData.date) {
          // Try to convert to date
          dataToUpdate.date = Timestamp.fromDate(new Date(feedbackData.date));
        } else {
          // If date is null or invalid, remove it from update
          delete dataToUpdate.date;
        }
      } else {
        // If date is undefined, don't include it in the update
        delete dataToUpdate.date;
      }

      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, dataToUpdate);

      // Update local state
      setFeedback(prev => prev.map(item =>
        item.id === feedbackId
          ? {
            ...item,
            ...feedbackData,
            // Only update date in local state if it was actually provided
            ...(feedbackData.date !== undefined && {
              date: feedbackData.date instanceof Date ? feedbackData.date : item.date
            }),
            updatedAt: new Date()
          }
          : item
      ));

      return true;
    } catch (err) {
      console.error('❌ Error updating feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Delete feedback
  const deleteFeedback = useCallback(async (feedbackId) => {
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));

      // Update local state
      setFeedback(prev => prev.filter(item => item.id !== feedbackId));

      return true;
    } catch (err) {
      console.error('❌ Error deleting feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get feedback by ID
  const getFeedbackById = useCallback(async (feedbackId) => {
    setLoading(true);
    setError(null);

    try {
      const feedbackDoc = await getDoc(doc(db, 'feedback', feedbackId));

      if (feedbackDoc.exists()) {
        const feedbackData = {
          id: feedbackDoc.id,
          ...feedbackDoc.data(),
          date: feedbackDoc.data().date?.toDate ? feedbackDoc.data().date.toDate() : feedbackDoc.data().date,
          createdAt: feedbackDoc.data().createdAt?.toDate ? feedbackDoc.data().createdAt.toDate() : feedbackDoc.data().createdAt
        };
        return feedbackData;
      } else {
        return null;
      }
    } catch (err) { 
      console.error('❌ Error fetching feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    feedback,
    loading,
    error,
    getFeedback,
    getFeedbackByVolunteerId,
    getFeedbackByFromVC,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    getFeedbackById
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};