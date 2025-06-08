// src/contexts/UsersContext.jsx - Optimized Version
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collection reference
  const usersCollection = collection(db, 'users');

  // Helper function to find document by user ID
  const findDocumentByUserId = async (userId) => {
    try {
      // First try to get the document directly using userId as document ID
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { docId: docSnap.id, data: docSnap.data() };
      }

      // If not found, try to find by 'id' field (fallback)
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

  // Set current user by ID - IMPROVED VERSION with useCallback
  const setCurrentUserById = useCallback(async (userId) => {
    if (!userId) {
      console.warn('⚠️ No user ID provided to setCurrentUserById');
      setCurrentUser(null);
      return;
    }

    console.log('👤 Setting current user by ID:', userId);

    try {
      // Try to get user document directly using userId as document ID
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = {
          docId: docSnap.id,
          id: userId, // Ensure ID is set
          ...docSnap.data()
        };

        setCurrentUser(userData);
        console.log('✅ Current user set (direct):', userData);
        return userData;
      } else {
        // Fallback: try to find by 'id' field
        const userData = await getUserById(userId);
        if (userData) {
          setCurrentUser(userData);
          console.log('✅ Current user set (query):', userData);
          return userData;
        } else {
          console.warn('⚠️ User not found, clearing current user');
          setCurrentUser(null);
          return null;
        }
      }
    } catch (err) {
      console.error('❌ Error setting current user:', err);
      setCurrentUser(null);
      return null;
    }
  }, []); // Empty dependency array since this function doesn't depend on any state or props

  // Clear current user (for logout) - with useCallback
  const clearCurrentUser = useCallback(() => {
    console.log('🚪 Clearing current user');
    setCurrentUser(null);
  }, []);

  // Get current user info (helper function)
  const getCurrentUser = () => {
    return currentUser;
  };

  // Check if current user has specific role
  const currentUserHasRole = (role) => {
    return currentUser && currentUser.role === role;
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
        docId: doc.id,
        id: doc.id, // Use document ID as user ID if no id field exists
        ...doc.data()
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
          id: userId, // Ensure ID is set
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
        id: doc.id, // Use document ID as user ID if no id field exists
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
        id: doc.id, // Use document ID as user ID if no id field exists
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

  // Create new user
  const createUser = async (userData) => {
    console.log('➕ Creating new user:', userData);
    setLoading(true);
    setError(null);

    try {
      const userDataWithTimestamps = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(usersCollection, userDataWithTimestamps);

      const newUser = {
        docId: docRef.id,
        id: docRef.id, // Use document ID as user ID
        ...userDataWithTimestamps,
        createdAt: new Date(),
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

  // Update user by their ID
  const updateUser = async (userId, userData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Updating user:', { userId, userData });

      // Prepare the update data
      const cleanedData = {
        ...userData,
        updatedAt: serverTimestamp()
      };

      // ONLY process orgId if it's explicitly provided in userData
      if ('orgId' in userData) {
        // Ensure orgId is an array of numbers when provided
        cleanedData.orgId = Array.isArray(userData.orgId)
          ? userData.orgId.map(Number)
          : userData.orgId ? [Number(userData.orgId)] : [];
      }
      // If orgId is not in userData, don't touch the existing orgId field

      // Get document reference
      const userRef = doc(db, 'users', String(userId));

      console.log('📝 Updating document with data:', cleanedData);

      // Update the document
      await updateDoc(userRef, cleanedData);

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === Number(userId)
            ? { ...user, ...cleanedData, updatedAt: new Date() }
            : user
        )
      );

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

  // Update current user (shorthand method)
  const updateCurrentUser = async (userData) => {
    if (!currentUser || !currentUser.id) {
      throw new Error('No current user to update');
    }

    return await updateUser(currentUser.id, userData);
  };

  // Delete user by their ID
  const deleteUser = async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🗑️ Deleting user with ID:', userId);
    setLoading(true);
    setError(null);

    try {
      // Try direct document reference first
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      let targetDocId = userId;

      if (!docSnap.exists()) {
        // Fallback: find by ID field
        const result = await findDocumentByUserId(userId);
        if (!result) {
          throw new Error(`User with ID ${userId} not found`);
        }
        targetDocId = result.docId;
      }

      await deleteDoc(doc(db, 'users', targetDocId));

      // Update local state
      setUsers(prev => prev.filter(user =>
        user.id !== userId && user.docId !== targetDocId
      ));

      // Clear current user if it's the deleted user
      if (currentUser && (currentUser.id === userId || currentUser.docId === targetDocId)) {
        setCurrentUser(null);
      }

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

    const filteredUsers = users.filter(user => {
      const searchableFields = [
        user.name,
        user.email,
        user.role,
        String(user.id)
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

  // REMOVED: useEffect that automatically fetches all users on mount
  // This was causing performance issues and infinite loops

  const value = {
    // State
    users,
    currentUser,
    loading,
    error,

    // CRUD operations
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,

    // Current user management
    setCurrentUserById,
    clearCurrentUser,
    getCurrentUser,
    currentUserHasRole,
    updateCurrentUser,

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