// src/contexts/VolunteerHoursContext.jsx - Updated with reject functionality
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
  serverTimestamp,
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
  const hoursCollection = collection(db, 'hoursTracking');

  // Helper function to convert Firestore timestamps to Date objects
  const processHoursData = (doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore timestamps to Date objects
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      // Ensure consistent data types
      volunteerId: String(data.volunteerId),
      orgId: Number(data.orgId),
      hours: Number(data.hours),
      approved: Boolean(data.approved),
      rejected: Boolean(data.rejected || false) // New field with default false
    };
  };

  // Get all volunteer hours (excluding rejected ones)
  const getVolunteerHours = useCallback(async (includeRejected = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(hoursCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let hoursData = querySnapshot.docs.map(processHoursData);
      
      // Filter out rejected hours unless specifically requested
      if (!includeRejected) {
        hoursData = hoursData.filter(record => !record.rejected);
      }
      
      setVolunteerHours(hoursData);
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get volunteer hours by volunteer ID (excluding rejected ones by default)
  const getVolunteerHoursByVolunteerId = useCallback(async (volunteerId, includeRejected = false) => {
    if (!volunteerId) {
      console.warn('⚠️ No volunteer ID provided');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Convert to string for consistent querying
      const volunteerIdStr = String(volunteerId);
      
      const q = query(
        hoursCollection, 
        where('volunteerId', '==', volunteerIdStr),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let hoursData = querySnapshot.docs.map(processHoursData);
      
      // Filter out rejected hours unless specifically requested
      if (!includeRejected) {
        hoursData = hoursData.filter(record => !record.rejected);
      }
      
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours by volunteer ID:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get volunteer hours by organization ID (excluding rejected ones by default)
  const getVolunteerHoursByOrganizationId = useCallback(async (orgId, includeRejected = false) => {
    if (orgId === undefined || orgId === null) {
      console.warn('⚠️ No organization ID provided');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const orgIdNum = Number(orgId);
      
      const q = query(
        hoursCollection, 
        where('orgId', '==', orgIdNum),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let hoursData = querySnapshot.docs.map(processHoursData);
      
      // Filter out rejected hours unless specifically requested
      if (!includeRejected) {
        hoursData = hoursData.filter(record => !record.rejected);
      }
      
      return hoursData;
    } catch (err) {
      console.error('❌ Error fetching volunteer hours by organization ID:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get specific volunteer hours record by ID
  const getVolunteerHoursById = useCallback(async (hoursId) => {
    if (!hoursId) {
      console.warn('⚠️ No hours ID provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'hoursTracking', hoursId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const hoursData = processHoursData(docSnap);
        return hoursData;
      } else {
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching volunteer hours by ID:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate total hours for a volunteer (excluding rejected)
  const getTotalHoursForVolunteer = useCallback(async (volunteerId, approvedOnly = true) => {
    if (!volunteerId) {
      console.warn('⚠️ No volunteer ID provided for total hours calculation');
      return 0;
    }    
    try {
      const hoursData = await getVolunteerHoursByVolunteerId(volunteerId, false); // Don't include rejected
      
      const filteredHours = approvedOnly 
        ? hoursData.filter(record => record.approved === true && !record.rejected)
        : hoursData.filter(record => !record.rejected);
      
      const totalHours = filteredHours.reduce((sum, record) => {
        return sum + Number(record.hours || 0);
      }, 0);
      
      return totalHours;
    } catch (err) {
      console.error('❌ Error calculating total hours:', err);
      return 0;
    }
  }, [getVolunteerHoursByVolunteerId]);

  // Log new volunteer hours
  const logVolunteerHours = useCallback(async (hoursData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields - Fixed validation to handle orgId: 0
      if (!hoursData.volunteerId || hoursData.orgId === undefined || hoursData.orgId === null || !hoursData.hours) {
        throw new Error('Missing required fields: volunteerId, orgId, and hours are required');
      }

      const dataToSave = {
        volunteerId: String(hoursData.volunteerId),
        orgId: Number(hoursData.orgId),
        hours: Number(hoursData.hours),
        approved: false, // Default to false
        rejected: false, // Default to false
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Include any additional fields
        ...Object.fromEntries(
          Object.entries(hoursData).filter(([key]) => 
            !['volunteerId', 'orgId', 'hours', 'approved', 'rejected', 'createdAt', 'updatedAt'].includes(key)
          )
        )
      };

      const docRef = await addDoc(hoursCollection, dataToSave);
      
      const newHours = { 
        id: docRef.id, 
        ...dataToSave,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update local state
      setVolunteerHours(prev => [newHours, ...prev]);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error logging volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update volunteer hours record
  const updateVolunteerHours = useCallback(async (hoursId, updateData) => {
    if (!hoursId) {
      throw new Error('Hours ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const cleanedData = {
        ...updateData,
        // Ensure correct data types
        ...(updateData.volunteerId && { volunteerId: String(updateData.volunteerId) }),
        ...(updateData.orgId !== undefined && { orgId: Number(updateData.orgId) }),
        ...(updateData.hours && { hours: Number(updateData.hours) }),
        ...(updateData.approved !== undefined && { approved: Boolean(updateData.approved) }),
        ...(updateData.rejected !== undefined && { rejected: Boolean(updateData.rejected) }),
        updatedAt: serverTimestamp()
      };

      const hoursRef = doc(db, 'hoursTracking', hoursId);
      await updateDoc(hoursRef, cleanedData);

      // Update local state
      setVolunteerHours(prev => 
        prev.map(record => 
          record.id === hoursId 
            ? { ...record, ...cleanedData, updatedAt: new Date() }
            : record
        )
      );

      return true;
    } catch (err) {
      console.error('❌ Error updating volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete volunteer hours record
  const deleteVolunteerHours = useCallback(async (hoursId) => {
    if (!hoursId) {
      throw new Error('Hours ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const hoursRef = doc(db, 'hoursTracking', hoursId);
      await deleteDoc(hoursRef);

      // Update local state
      setVolunteerHours(prev => prev.filter(record => record.id !== hoursId));

      return true;
    } catch (err) {
      console.error('❌ Error deleting volunteer hours:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve volunteer hours
  const updateHoursApprovalStatus = useCallback(async (hoursId, approved) => {
    return await updateVolunteerHours(hoursId, { approved, rejected: false });
  }, [updateVolunteerHours]);

  // Reject volunteer hours - NEW FUNCTION
  const updateHoursRejectionStatus = useCallback(async (hoursId, rejected) => {
    return await updateVolunteerHours(hoursId, { rejected, approved: false });
  }, [updateVolunteerHours]);

  // Bulk approve hours
  const bulkApproveHours = useCallback(async (hoursIds, approved = true) => {
    setLoading(true);
    setError(null);

    try {
      const updatePromises = hoursIds.map(hoursId =>
        updateVolunteerHours(hoursId, { approved, rejected: false })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (err) {
      console.error('❌ Error in bulk approval update:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateVolunteerHours]);

  // Bulk reject hours - NEW FUNCTION
  const bulkRejectHours = useCallback(async (hoursIds, rejected = true) => {
    setLoading(true);
    setError(null);

    try {
      const updatePromises = hoursIds.map(hoursId =>
        updateVolunteerHours(hoursId, { rejected, approved: false })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (err) {
      console.error('❌ Error in bulk rejection update:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateVolunteerHours]);

  // Get hours statistics
  const getHoursStatistics = useCallback(async (filters = {}) => {
    
    try {
      let hoursData = volunteerHours;
      
      // If we don't have data in state, fetch it
      if (hoursData.length === 0) {
        hoursData = await getVolunteerHours(true); // Include rejected for statistics
      }

      // Apply filters
      if (filters.volunteerId) {
        hoursData = hoursData.filter(record => record.volunteerId === String(filters.volunteerId));
      }
      if (filters.orgId !== undefined) {
        hoursData = hoursData.filter(record => record.orgId === Number(filters.orgId));
      }
      if (filters.approved !== undefined) {
        hoursData = hoursData.filter(record => record.approved === filters.approved);
      }
      if (filters.rejected !== undefined) {
        hoursData = hoursData.filter(record => record.rejected === filters.rejected);
      }

      const stats = {
        totalRecords: hoursData.length,
        totalHours: hoursData.reduce((sum, record) => sum + Number(record.hours || 0), 0),
        approvedHours: hoursData
          .filter(record => record.approved && !record.rejected)
          .reduce((sum, record) => sum + Number(record.hours || 0), 0),
        pendingHours: hoursData
          .filter(record => !record.approved && !record.rejected)
          .reduce((sum, record) => sum + Number(record.hours || 0), 0),
        rejectedHours: hoursData
          .filter(record => record.rejected)
          .reduce((sum, record) => sum + Number(record.hours || 0), 0),
        uniqueVolunteers: new Set(hoursData.map(record => record.volunteerId)).size,
        uniqueOrganizations: new Set(hoursData.map(record => record.orgId)).size
      };

      return stats;
    } catch (err) {
      console.error('❌ Error calculating statistics:', err);
      return {
        totalRecords: 0,
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        rejectedHours: 0,
        uniqueVolunteers: 0,
        uniqueOrganizations: 0
      };
    }
  }, [volunteerHours, getVolunteerHours]);

  const value = {
    // State
    volunteerHours,
    loading,
    error,
    
    // CRUD operations
    getVolunteerHours,
    getVolunteerHoursById,
    logVolunteerHours,
    updateVolunteerHours,
    deleteVolunteerHours,
    
    // Query operations
    getVolunteerHoursByVolunteerId,
    getVolunteerHoursByOrganizationId,
    getTotalHoursForVolunteer,
    
    // Approval operations
    updateHoursApprovalStatus,
    updateHoursRejectionStatus, // NEW
    bulkApproveHours,
    bulkRejectHours, // NEW
    
    // Statistics
    getHoursStatistics
  };

  return (
    <VolunteerHoursContext.Provider value={value}>
      {children}
    </VolunteerHoursContext.Provider>
  );
};