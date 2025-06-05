// src/contexts/FeedbackContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

const FeedbackContext = createContext();

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all feedback for a volunteer
  const getFeedbackByVolunteerId = async (volunteerId) => {
    try {
      setLoading(true);
      console.log(`Fetching feedback for volunteer ID: ${volunteerId}`);
      const feedbackCollection = collection(db, 'Feedback');
      const q = query(
        feedbackCollection, 
        where('volunteerId', '==', volunteerId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const volunteerFeedback = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFeedback(volunteerFeedback);
      console.log(`Found ${volunteerFeedback.length} feedback entries for volunteer:`, volunteerFeedback);
      setLoading(false);
      return volunteerFeedback;
    } catch (err) {
      console.error('Error fetching volunteer feedback:', err);
      setError('Failed to fetch volunteer feedback');
      setLoading(false);
      return [];
    }
  };

  // Fetch feedback given by a volunteer coordinator
  const getFeedbackByCoordinatorId = async (coordinatorId) => {
    try {
      setLoading(true);
      console.log(`Fetching feedback given by coordinator ID: ${coordinatorId}`);
      const feedbackCollection = collection(db, 'Feedback');
      const q = query(
        feedbackCollection, 
        where('fromVCId', '==', coordinatorId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const coordinatorFeedback = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFeedback(coordinatorFeedback);
      console.log(`Found ${coordinatorFeedback.length} feedback entries from coordinator:`, coordinatorFeedback);
      setLoading(false);
      return coordinatorFeedback;
    } catch (err) {
      console.error('Error fetching coordinator feedback:', err);
      setError('Failed to fetch coordinator feedback');
      setLoading(false);
      return [];
    }
  };

  // Get a single feedback by ID
  const getFeedbackById = async (feedbackId) => {
    try {
      console.log(`Fetching feedback with ID: ${feedbackId}`);
      const feedbackRef = doc(db, 'Feedback', feedbackId);
      const feedbackSnap = await getDoc(feedbackRef);
      
      if (feedbackSnap.exists()) {
        const feedbackData = { id: feedbackSnap.id, ...feedbackSnap.data() };
        console.log('Feedback found:', feedbackData);
        return feedbackData;
      } else {
        console.log('No feedback found with ID:', feedbackId);
        return null;
      }
    } catch (err) {
      console.error('Error getting feedback:', err);
      setError('Failed to get feedback');
      return null;
    }
  };

  // Create new feedback
  const createFeedback = async (feedbackData) => {
    try {
      // Ensure we set default values for required fields
      const completeFeedback = {
        date: new Date(),
        ...feedbackData
      };
      
      console.log('Creating new feedback with data:', completeFeedback);
      const feedbackCollection = collection(db, 'Feedback');
      const docRef = await addDoc(feedbackCollection, completeFeedback);
      const newFeedback = { id: docRef.id, ...completeFeedback };
      
      // Update state with new feedback
      setFeedback(prevFeedback => [...prevFeedback, newFeedback]);
      
      console.log('Feedback created successfully with ID:', docRef.id);
      return newFeedback;
    } catch (err) {
      console.error('Error creating feedback:', err);
      setError('Failed to create feedback');
      return null;
    }
  };

  // Update existing feedback
  const updateFeedback = async (feedbackId, feedbackData) => {
    try {
      console.log(`Updating feedback ${feedbackId} with data:`, feedbackData);
      const feedbackRef = doc(db, 'Feedback', feedbackId);
      await updateDoc(feedbackRef, feedbackData);
      
      // Update state
      setFeedback(prevFeedback => 
        prevFeedback.map(feedback => 
          feedback.id === feedbackId ? { ...feedback, ...feedbackData } : feedback
        )
      );
      
      console.log('Feedback updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating feedback:', err);
      setError('Failed to update feedback');
      return false;
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    try {
      console.log(`Deleting feedback with ID: ${feedbackId}`);
      const feedbackRef = doc(db, 'Feedback', feedbackId);
      await deleteDoc(feedbackRef);
      
      // Update state
      setFeedback(prevFeedback => prevFeedback.filter(feedback => feedback.id !== feedbackId));
      
      console.log('Feedback deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Failed to delete feedback');
      return false;
    }
  };

  const value = {
    feedback,
    loading,
    error,
    getFeedbackByVolunteerId,
    getFeedbackByCoordinatorId,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}