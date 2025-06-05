// src/contexts/VolunteerHoursContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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

const VolunteerHoursContext = createContext();

export const useVolunteerHours = () => {
  const context = useContext(VolunteerHoursContext);
  if (!context) {
    throw new Error('useVolunteerHours must be used within a VolunteerHoursProvider');
  }
  return context;
};

export const VolunteerHoursProvider = ({ children }) => {
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection reference
  const volunteerHoursCollection = collection(db, 'volunteerHours');

  // Get all volunteer hours
  const getVolunteerHours = async () => {
    console.log('⏰ Fetching all volunteer hours...');
    setLoading(true);
    setError(null);
    
    try {
      const q = query(volunteerHoursCollection, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const hoursData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JavaScript Date
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
      }));
      
      setVolunteerHours(hoursData);
      console.log('✅ Volunteer hours fetched successfully:', hoursData.length, 'records');
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get volunteer hours by volunteer ID
  const getVolunteerHoursByVolunteerId = async (volunteerId) => {
    console.log('👤 Fetching volunteer hours for volunteer:', volunteerId);
    setLoading(true);
    setError(null);

    try {
      const q = query(
        volunteerHoursCollection, 
        where('volunteerId', '==', volunteerId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const hoursData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
      }));
      
      console.log(`✅ Found ${hoursData.length} volunteer hour records for volunteer: ${volunteerId}`);
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours by volunteer ID:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get volunteer hours by organization ID
  const getVolunteerHoursByOrganizationId = async (orgId) => {
    console.log('🏢 Fetching volunteer hours for organization:', orgId);
    setLoading(true);
    setError(null);

    try {
      const q = query(
        volunteerHoursCollection, 
        where('orgId', '==', orgId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const hoursData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
      }));
      
      console.log(`✅ Found ${hoursData.length} volunteer hour records for organization: ${orgId}`);
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours by organization ID:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get pending volunteer hours (not approved)
  const getPendingVolunteerHours = async () => {
    console.log('⏳ Fetching pending volunteer hours...');
    setLoading(true);
    setError(null);

    try {
      const q = query(
        volunteerHoursCollection, 
        where('approved', '==', false),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const hoursData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
      }));
      
      console.log(`✅ Found ${hoursData.length} pending volunteer hour records`);
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching pending volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get volunteer hours by ID
  const getVolunteerHoursById = async (hoursId) => {
    console.log('🔍 Fetching volunteer hours by ID:', hoursId);
    setLoading(true);
    setError(null);

    try {
      const hoursDoc = await getDoc(doc(db, 'volunteerHours', hoursId));
      
      if (hoursDoc.exists()) {
        const hoursData = { 
          id: hoursDoc.id, 
          ...hoursDoc.data(),
          date: hoursDoc.data().date?.toDate ? hoursDoc.data().date.toDate() : hoursDoc.data().date
        };
        console.log('✅ Volunteer hours found:', hoursData);
        return hoursData;
      } else {
        console.log('⚠️ Volunteer hours not found with ID:', hoursId);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log new volunteer hours
  const logVolunteerHours = async (hoursData) => {
    console.log('➕ Logging new volunteer hours:', hoursData);
    setLoading(true);
    setError(null);

    try {
      // Convert date to Firestore timestamp if it's a Date object
      const dataToSave = {
        ...hoursData,
        date: hoursData.date instanceof Date ? Timestamp.fromDate(hoursData.date) : hoursData.date,
        approved: false, // Default to not approved
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(volunteerHoursCollection, dataToSave);
      
      const newHours = { 
        id: docRef.id, 
        ...hoursData,
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setVolunteerHours(prev => [newHours, ...prev]);
      
      console.log('✅ Volunteer hours logged successfully with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ Error logging volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update volunteer hours
  const updateVolunteerHours = async (hoursId, hoursData) => {
    console.log('📝 Updating volunteer hours:', hoursId, hoursData);
    setLoading(true);
    setError(null);

    try {
      // Convert date to Firestore timestamp if it's a Date object
      const dataToUpdate = {
        ...hoursData,
        date: hoursData.date instanceof Date ? Timestamp.fromDate(hoursData.date) : hoursData.date,
        updatedAt: new Date()
      };

      const hoursRef = doc(db, 'volunteerHours', hoursId);
      await updateDoc(hoursRef, dataToUpdate);
      
      // Update local state
      setVolunteerHours(prev => prev.map(hours => 
        hours.id === hoursId 
          ? { ...hours, ...hoursData, updatedAt: new Date() }
          : hours
      ));
      
      console.log('✅ Volunteer hours updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve volunteer hours
  const approveVolunteerHours = async (hoursId) => {
    console.log('✅ Approving volunteer hours:', hoursId);
    return await updateVolunteerHours(hoursId, { approved: true });
  };

  // Reject volunteer hours
  const rejectVolunteerHours = async (hoursId) => {
    console.log('❌ Rejecting volunteer hours:', hoursId);
    return await updateVolunteerHours(hoursId, { approved: false });
  };

  // Delete volunteer hours
  const deleteVolunteerHours = async (hoursId) => {
    console.log('🗑️ Deleting volunteer hours:', hoursId);
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'volunteerHours', hoursId));
      
      // Update local state
      setVolunteerHours(prev => prev.filter(hours => hours.id !== hoursId));
      
      console.log('✅ Volunteer hours deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Error deleting volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate total hours for a volunteer
  const getTotalHoursForVolunteer = async (volunteerId, approved = true) => {
    console.log('📊 Calculating total hours for volunteer:', volunteerId, 'approved:', approved);
    
    try {
      const hoursData = await getVolunteerHoursByVolunteerId(volunteerId);
      const filteredHours = approved 
        ? hoursData.filter(hours => hours.approved === true)
        : hoursData;
      
      const totalHours = filteredHours.reduce((sum, hours) => sum + (hours.hours || 0), 0);
      console.log(`✅ Total hours: ${totalHours} for volunteer: ${volunteerId}`);
      return totalHours;
    } catch (err) {
      console.error('❌ Error calculating total hours:', err);
      throw err;
    }
  };

  const value = {
    volunteerHours,
    loading,
    error,
    getVolunteerHours,
    getVolunteerHoursByVolunteerId,
    getVolunteerHoursByOrganizationId,
    getPendingVolunteerHours,
    getVolunteerHoursById,
    logVolunteerHours,
    updateVolunteerHours,
    approveVolunteerHours,
    rejectVolunteerHours,
    deleteVolunteerHours,
    getTotalHoursForVolunteer
  };

  return (
    <VolunteerHoursContext.Provider value={value}>
      {children}
    </VolunteerHoursContext.Provider>
  );
};