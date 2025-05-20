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

  // Get all organizations
  const getOrganizations = async () => {
    console.log('🏢 Fetching all organizations...');
    setLoading(true);
    setError(null);
    
    try {
      const querySnapshot = await getDocs(organizationsCollection);
      const orgData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setOrganizations(orgData);
      console.log('✅ Organizations fetched successfully:', orgData.length, 'organizations');
      return orgData;
    } catch (err) {
      console.error('❌ Error fetching organizations:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get organization by ID
  const getOrganizationById = async (orgId) => {
    console.log('🔍 Fetching organization by ID:', orgId);
    setLoading(true);
    setError(null);

    try {
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      
      if (orgDoc.exists()) {
        const orgData = { id: orgDoc.id, ...orgDoc.data() };
        console.log('✅ Organization found:', orgData);
        return orgData;
      } else {
        console.log('⚠️ Organization not found with ID:', orgId);
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
    console.log('🌆 Fetching organizations by city:', city);
    setLoading(true);
    setError(null);

    try {
      const q = query(organizationsCollection, where('City', '==', city));
      const querySnapshot = await getDocs(q);
      const orgData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Found ${orgData.length} organizations in: ${city}`);
      return orgData;
    } catch (err) {
      console.error('❌ Error fetching organizations by city:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new organization
  const createOrganization = async (orgData) => {
    console.log('➕ Creating new organization:', orgData);
    setLoading(true);
    setError(null);

    try {
      const docRef = await addDoc(organizationsCollection, {
        ...orgData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newOrg = { id: docRef.id, ...orgData };
      setOrganizations(prev => [...prev, newOrg]);
      
      console.log('✅ Organization created successfully with ID:', docRef.id);
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
    console.log('📝 Updating organization:', orgId, orgData);
    setLoading(true);
    setError(null);

    try {
      const orgRef = doc(db, 'organizations', orgId);
      await updateDoc(orgRef, {
        ...orgData,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === orgId 
          ? { ...org, ...orgData, updatedAt: new Date() }
          : org
      ));
      
      console.log('✅ Organization updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete organization
  const deleteOrganization = async (orgId) => {
    console.log('🗑️ Deleting organization:', orgId);
    setLoading(true);
    setError(null);

    try {
      await deleteDoc(doc(db, 'organizations', orgId));
      
      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      console.log('✅ Organization deleted successfully');
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
    console.log('👥 Adding volunteer to organization:', orgId, volunteerId);
    setLoading(true);
    setError(null);

    try {
      // First get current organization data
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();
      const currentVolunteers = orgData.vcId || [];
      
      // Add volunteer if not already in the list
      if (!currentVolunteers.includes(volunteerId)) {
        const updatedVolunteers = [...currentVolunteers, volunteerId];
        
        await updateDoc(doc(db, 'organizations', orgId), {
          vcId: updatedVolunteers,
          updatedAt: new Date()
        });

        // Update local state
        setOrganizations(prev => prev.map(org => 
          org.id === orgId 
            ? { ...org, vcId: updatedVolunteers, updatedAt: new Date() }
            : org
        ));

        console.log('✅ Volunteer added to organization successfully');
        return true;
      } else {
        console.log('⚠️ Volunteer already in organization');
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
    console.log('👤 Removing volunteer from organization:', orgId, volunteerId);
    setLoading(true);
    setError(null);

    try {
      // First get current organization data
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();
      const currentVolunteers = orgData.vcId || [];
      
      // Remove volunteer from the list
      const updatedVolunteers = currentVolunteers.filter(id => id !== volunteerId);
      
      await updateDoc(doc(db, 'organizations', orgId), {
        vcId: updatedVolunteers,
        updatedAt: new Date()
      });

      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === orgId 
          ? { ...org, vcId: updatedVolunteers, updatedAt: new Date() }
          : org
      ));

      console.log('✅ Volunteer removed from organization successfully');
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
    createOrganization,
    updateOrganization,
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