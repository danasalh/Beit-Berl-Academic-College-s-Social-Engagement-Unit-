// src/contexts/FeedbackContext.jsx - Enhanced with Admin Notifications
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const FeedbackContext = createContext();

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
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
        console.log('No admin users found to notify');
        return;
      }

      const volunteerName = volunteerDetails 
        ? `${volunteerDetails.firstName || ''} ${volunteerDetails.lastName || ''}`.trim() || `User ${volunteerDetails.id}`
        : `User ${feedbackData.volunteerId}`;

      const fromUserName = fromUserDetails 
        ? `${fromUserDetails.firstName || ''} ${fromUserDetails.lastName || ''}`.trim() || `User ${fromUserDetails.id}`
        : `User ${feedbackData.fromVCId}`;

      const orgName = orgDetails 
        ? orgDetails.name || orgDetails.organizationName || `Organization ${orgDetails.id}`
        : 'Unknown Organization';

      // Move title to notification panel - use generic type-based approach
      const notificationContent = `המשתמש ${fromUserName} מ ${orgName} הזין פידבק חדש עבור המתנדב ${volunteerName} at ${new Date().toLocaleString()}. ניתן לראות את הפידבק בפרופיל המתנדב.`;

      // Create notifications for all admin users
      const notificationPromises = adminUsers.map(admin => {
        const notificationData = {
          receiverId: String(admin.id),
          relatedId: String(feedbackData.volunteerId),
          type: 'feedback-notification', // This will be used in NotificationsPanel for styling and title
          title: '', // Will be generated in NotificationsPanel based on type
          content: notificationContent,
          date: Timestamp.now(),
          read: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Additional metadata for better tracking
          metadata: {
            feedbackId: feedbackData.id,
            volunteerId: feedbackData.volunteerId,
            fromUserId: feedbackData.fromVCId,
            orgId: fromUserDetails?.orgId?.[0] || null,
            volunteerName,
            fromUserName,
            orgName
          }
        };

        return addDoc(notificationsCollection, notificationData);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Created notifications for ${adminUsers.length} admin users`);
    } catch (error) {
      console.error('❌ Error creating admin notifications:', error);
      // Don't throw here - we don't want notification failures to break feedback creation
    }
  };

  // Get all feedback
  const getFeedback = useCallback(async () => {
    console.log('📋 Fetching all feedback...');
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
      console.log('✅ Feedback fetched successfully:', feedbackData.length, 'items');
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
    console.log('👤 Fetching feedback for volunteer:', volunteerId);
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
      
      console.log(`✅ Found ${feedbackData.length} feedback items for volunteer: ${volunteerId}`);
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
    console.log('👨‍💼 Fetching feedback from VC:', fromVCId);
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
      
      console.log(`✅ Found ${feedbackData.length} feedback items from VC: ${fromVCId}`);
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
    console.log('➕ Creating new feedback:', feedbackData);
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
      
      console.log('✅ Feedback created successfully with ID:', docRef.id);

      // Get user details for notifications (run in parallel)
      const [volunteerDetails, fromUserDetails] = await Promise.all([
        getUserDetails(feedbackData.volunteerId),
        getUserDetails(feedbackData.fromVCId)
      ]);

      // Get organization details if available
      let orgDetails = null;
      if (fromUserDetails?.orgId?.[0]) {
        orgDetails = await getOrganizationDetails(fromUserDetails.orgId[0]);
      }

      // Create notifications for admin users (don't wait for it)
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
    console.log('📝 Updating feedback:', feedbackId, feedbackData);
    setLoading(true);
    setError(null);

    try {
      const dataToUpdate = {
        ...feedbackData,
        date: feedbackData.date instanceof Date ? Timestamp.fromDate(feedbackData.date) : feedbackData.date,
        updatedAt: Timestamp.now()
      };

      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, dataToUpdate);
      
      // Update local state
      setFeedback(prev => prev.map(item => 
        item.id === feedbackId 
          ? { 
              ...item, 
              ...feedbackData,
              date: feedbackData.date instanceof Date ? feedbackData.date : item.date,
              updatedAt: new Date() 
            }
          : item
      ));
      
      console.log('✅ Feedback updated successfully');
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
    console.log('🗑️ Deleting feedback:', feedbackId);
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
      
      // Update local state
      setFeedback(prev => prev.filter(item => item.id !== feedbackId));
      
      console.log('✅ Feedback deleted successfully');
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
    console.log('🔍 Fetching feedback by ID:', feedbackId);
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
        console.log('✅ Feedback found:', feedbackData);
        return feedbackData;
      } else {
        console.log('⚠️ Feedback not found with ID:', feedbackId);
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