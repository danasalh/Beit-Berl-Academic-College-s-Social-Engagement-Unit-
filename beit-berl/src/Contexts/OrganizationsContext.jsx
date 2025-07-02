// src/contexts/OrganizationsContext.jsx
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
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const OrganizationsContext = createContext();

export const useOrganizations = () => {
  const context = useContext(OrganizationsContext);
  if (!context) {
    throw new Error('useOrganizations must be used within an OrganizationsProvider');
  }
  return context;
};

export const OrganizationsProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection reference
  const organizationsCollection = collection(db, 'organizations');

  // Helper function to generate unique ID
  const generateUniqueId = (existingOrgs) => {
    const existingIds = existingOrgs.map(org => org.id || 0);
    let newId = Math.max(...existingIds, 0) + 1;
    
    // Make sure the ID is truly unique
    while (existingIds.includes(newId)) {
      newId++;
    }
    
    return newId;
  };

  // Get all organizations
  const getOrganizations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const querySnapshot = await getDocs(organizationsCollection);
      
      const orgData = querySnapshot.docs.map(doc => {
        const data = { firebaseId: doc.id, ...doc.data() };
        return data;
      });
      
      setOrganizations(orgData);
      return orgData;
    } catch (err) {
      console.error('❌ Error fetching organizations:', err);
      console.error('❌ Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get organization by ID
  const getOrganizationById = async (orgId) => {
    setLoading(true);
    setError(null);

    try {
      // First try to find by custom id field
      const q = query(organizationsCollection, where('id', '==', orgId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const orgDoc = querySnapshot.docs[0];
        const orgData = { firebaseId: orgDoc.id, ...orgDoc.data() };
        return orgData;
      }
      
      // If not found by custom ID, try Firebase document ID
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      
      if (orgDoc.exists()) {
        const orgData = { firebaseId: orgDoc.id, ...orgDoc.data() };
        return orgData;
      } else {
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get organizations by city
  const getOrganizationsByCity = async (city) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(organizationsCollection, where('City', '==', city));
      const querySnapshot = await getDocs(q);
      const orgData = querySnapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      }));
      
      return orgData;
    } catch (err) {
      console.error('❌ Error fetching organizations by city:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get organizations by status
  const getOrganizationsByStatus = async (status) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(organizationsCollection, where('status', '==', status));
      const querySnapshot = await getDocs(q);
      const orgData = querySnapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      }));
      
      return orgData;
    } catch (err) {
      console.error('❌ Error fetching organizations by status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get active organizations only
  const getActiveOrganizations = async () => {
    return await getOrganizationsByStatus(true);
  };

  // Create new organization
  const createOrganization = async (orgData) => {
    setLoading(true);
    setError(null);

    try {
      // Generate unique ID
      const uniqueId = generateUniqueId(organizations);
      
      const newOrgData = {
        ...orgData,
        id: uniqueId,
        contactInfo: orgData.contactInfo || '',
        orgRepId: orgData.orgRepId || null,
        vcId: orgData.vcId || [],
        link: orgData.link || '', // New field for organization link
        status: orgData.status !== undefined ? orgData.status : true, // New field for status (default: active/true)
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(organizationsCollection, newOrgData);
      
      const newOrg = { firebaseId: docRef.id, ...newOrgData };
      setOrganizations(prev => [...prev, newOrg]);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (orgId, orgData) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const orgRef = doc(db, 'organizations', org.firebaseId);
      const updateData = {
        ...orgData,
        updatedAt: new Date()
      };
      
      await updateDoc(orgRef, updateData);
      
      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === orgId 
          ? { ...org, ...updateData }
          : org
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error updating organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update organization status
  const updateOrganizationStatus = async (orgId, status) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const orgRef = doc(db, 'organizations', org.firebaseId);
      const updateData = {
        status: status,
        updatedAt: new Date()
      };
      
      await updateDoc(orgRef, updateData);
      
      // Update local state
      setOrganizations(prev => prev.map(o => 
        o.id === orgId 
          ? { ...o, ...updateData }
          : o
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error updating organization status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update organization link
  const updateOrganizationLink = async (orgId, link) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const orgRef = doc(db, 'organizations', org.firebaseId);
      const updateData = {
        link: link,
        updatedAt: new Date()
      };
      
      await updateDoc(orgRef, updateData);
      
      // Update local state
      setOrganizations(prev => prev.map(o => 
        o.id === orgId 
          ? { ...o, ...updateData }
          : o
      ));
      
      return true;
    } catch (err) {
      console.error('❌ Error updating organization link:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle organization status (active/inactive)
  const toggleOrganizationStatus = async (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      throw new Error('Organization not found');
    }
    
    const newStatus = !org.status;
    return await updateOrganizationStatus(orgId, newStatus);
  };

  // Delete organization
  const deleteOrganization = async (orgId) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      await deleteDoc(doc(db, 'organizations', org.firebaseId));
      
      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      return true;
    } catch (err) {
      console.error('❌ Error deleting organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add volunteer to organization
  const addVolunteerToOrganization = async (orgId, volunteerId) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const currentVolunteers = org.vcId || [];
      
      // Add volunteer if not already in the list
      if (!currentVolunteers.includes(volunteerId)) {
        const updatedVolunteers = [...currentVolunteers, volunteerId];
        
        await updateDoc(doc(db, 'organizations', org.firebaseId), {
          vcId: updatedVolunteers,
          updatedAt: new Date()
        });

        // Update local state
        setOrganizations(prev => prev.map(o => 
          o.id === orgId 
            ? { ...o, vcId: updatedVolunteers, updatedAt: new Date() }
            : o
        ));

        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('❌ Error adding volunteer to organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove volunteer from organization
  const removeVolunteerFromOrganization = async (orgId, volunteerId) => {
    setLoading(true);
    setError(null);

    try {
      // Find the organization by custom ID
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      const currentVolunteers = org.vcId || [];
      
      // Remove volunteer from the list
      const updatedVolunteers = currentVolunteers.filter(id => id !== volunteerId);
      
      await updateDoc(doc(db, 'organizations', org.firebaseId), {
        vcId: updatedVolunteers,
        updatedAt: new Date()
      });

      // Update local state
      setOrganizations(prev => prev.map(o => 
        o.id === orgId 
          ? { ...o, vcId: updatedVolunteers, updatedAt: new Date() }
          : o
      ));

      return true;
    } catch (err) {
      console.error('❌ Error removing volunteer from organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    organizations,
    loading,
    error,
    getOrganizations,
    getOrganizationById,
    getOrganizationsByCity,
    getOrganizationsByStatus,
    getActiveOrganizations,
    createOrganization,
    updateOrganization,
    updateOrganizationStatus,
    updateOrganizationLink,
    toggleOrganizationStatus,
    deleteOrganization,
    addVolunteerToOrganization,
    removeVolunteerFromOrganization
  };

  return (
    <OrganizationsContext.Provider value={value}>
      {children}
    </OrganizationsContext.Provider>
  );
};