// src/contexts/UsersContext.jsx
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const UsersContext = createContext();

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection reference
  const usersCollection = collection(db, 'users');

  // Helper function to find document by user ID
  const findDocumentByUserId = async (userId) => {
    try {
      const q = query(usersCollection, where('id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { docId: doc.id, data: doc.data() };
      }
      return null;
    } catch (err) {
      console.error('Error finding document by user ID:', err);
      throw err;
    }
  };

  // Get all users
  const getUsers = async () => {
    console.log('📋 Fetching all users...');
    setLoading(true);
    setError(null);

    try {
      const q = query(usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,  // Firestore document ID
        ...doc.data()   // This includes the user's id field
      }));

      setUsers(usersData);
      console.log('✅ Users fetched successfully:', usersData.length, 'users');
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user by their ID (not document ID)
  const getUserById = async (userId) => {
    if (!userId) {
      console.warn('⚠️ No user ID provided');
      return null;
    }

    console.log('🔍 Fetching user by ID:', userId);
    setLoading(true);
    setError(null);

    try {
      const result = await findDocumentByUserId(userId);
      
      if (result) {
        const userData = {
          docId: result.docId,
          ...result.data
        };
        console.log('✅ User found:', userData);
        return userData;
      } else {
        console.log('⚠️ User not found with ID:', userId);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get users by role
  const getUsersByRole = async (role) => {
    if (!role) {
      console.warn('⚠️ No role provided');
      return [];
    }

    console.log('🎭 Fetching users by role:', role);
    setLoading(true);
    setError(null);

    try {
      const q = query(
        usersCollection, 
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${usersData.length} users with role: ${role}`);
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users by role:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get users by organization
  const getUsersByOrganization = async (orgId) => {
    if (!orgId) {
      console.warn('⚠️ No organization ID provided');
      return [];
    }

    console.log('🏢 Fetching users by organization:', orgId);
    setLoading(true);
    setError(null);

    try {
      const q = query(
        usersCollection, 
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${usersData.length} users in organization: ${orgId}`);
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users by organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new user (for completeness, though you mentioned using different method for registration)
  const createUser = async (userData) => {
    console.log('➕ Creating new user:', userData);
    setLoading(true);
    setError(null);

    try {
      // Add timestamps and ensure user has an ID
      const userDataWithTimestamps = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(usersCollection, userDataWithTimestamps);

      const newUser = { 
        docId: docRef.id,
        ...userDataWithTimestamps,
        createdAt: new Date(), // For immediate local display
        updatedAt: new Date()
      };
      setUsers(prev => [newUser, ...prev]);

      console.log('✅ User created successfully with doc ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user by their ID (not document ID)
  const updateUser = async (userId, userData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('📝 Updating user with ID:', userId, userData);
    setLoading(true);
    setError(null);

    try {
      // First find the document by user ID
      const result = await findDocumentByUserId(userId);
      
      if (!result) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Update the document
      const docRef = doc(db, 'users', result.docId);
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { 
              ...user, 
              ...userData, 
              updatedAt: new Date() // For immediate local display
            }
          : user
      ));

      console.log('✅ User updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete user by their ID (not document ID)
  const deleteUser = async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🗑️ Deleting user with ID:', userId);
    setLoading(true);
    setError(null);

    try {
      // First find the document by user ID
      const result = await findDocumentByUserId(userId);
      
      if (!result) {
        throw new Error(`User with ID ${userId} not found`);
      }

      await deleteDoc(doc(db, 'users', result.docId));

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));

      console.log('✅ User deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (userId, status) => {
    if (!userId || !status) {
      throw new Error('User ID and status are required');
    }

    console.log('🔄 Updating user status:', userId, status);
    return await updateUser(userId, { status });
  };

  // Bulk operations
  const bulkUpdateUsers = async (userUpdates) => {
    console.log('🔄 Bulk updating users:', userUpdates.length, 'users');
    setLoading(true);
    setError(null);

    try {
      const updatePromises = userUpdates.map(({ userId, userData }) =>
        updateUser(userId, userData)
      );

      await Promise.all(updatePromises);
      console.log('✅ Bulk update completed successfully');
      return true;
    } catch (err) {
      console.error('❌ Error in bulk update:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async (searchTerm) => {
    if (!searchTerm) {
      return users;
    }

    console.log('🔍 Searching users:', searchTerm);
    
    // Client-side search
    const filteredUsers = users.filter(user => {
      const searchableFields = [
        user.name,
        user.email,
        user.role,
        String(user.id) // Convert ID to string for search
      ].filter(Boolean);

      return searchableFields.some(field =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    console.log(`✅ Found ${filteredUsers.length} users matching: ${searchTerm}`);
    return filteredUsers;
  };

  // Check if user exists
  const userExists = async (userId) => {
    if (!userId) return false;

    try {
      const result = await findDocumentByUserId(userId);
      return result !== null;
    } catch (err) {
      console.error('❌ Error checking user existence:', err);
      return false;
    }
  };

  // Initialize - fetch users on mount
  useEffect(() => {
    getUsers();
  }, []);

  const value = {
    // State
    users,
    loading,
    error,
    
    // CRUD operations
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    
    // Filtered queries
    getUsersByRole,
    getUsersByOrganization,
    
    // Utility functions
    updateUserStatus,
    bulkUpdateUsers,
    searchUsers,
    userExists
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};