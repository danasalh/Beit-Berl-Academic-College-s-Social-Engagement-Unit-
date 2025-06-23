// src/contexts/UsersContext.jsx - Fixed Version to Prevent Infinite Loops
import { createContext, useContext, useState, useCallback, useRef } from 'react';
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

  // Use ref to prevent multiple simultaneous requests
  const loadingRef = useRef(false);
  const usersLoadedRef = useRef(false);

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

  // Set current user by ID - STABLE VERSION
  const setCurrentUserById = useCallback(async (userId) => {
    if (!userId) {
      console.warn('⚠️ No user ID provided to setCurrentUserById');
      setCurrentUser(null);
      return null;
    }

    console.log('👤 Setting current user by ID:', userId);

    try {
      // Try to get user document directly using userId as document ID
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = {
          docId: docSnap.id,
          id: userId,
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
  }, []);

  // Clear current user (for logout)
  const clearCurrentUser = useCallback(() => {
    console.log('🚪 Clearing current user');
    setCurrentUser(null);
  }, []);

  // Get current user info (helper function)
  const getCurrentUser = useCallback(() => {
    return currentUser;
  }, [currentUser]);

  // Check if current user has specific role - STABLE VERSION
  const currentUserHasRole = useCallback((role) => {
    if (!currentUser?.role) return false;
    const userRole = currentUser.role.toLowerCase();
    const checkRole = role.toLowerCase();
    return userRole === checkRole;
  }, [currentUser?.role]);

  // Get all users - PREVENT MULTIPLE CALLS
  const getUsers = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (loadingRef.current && !forceRefresh) {
      console.log('⏳ Users already loading, skipping...');
      return users;
    }

    // If users already loaded and not forcing refresh, return cached data
    if (usersLoadedRef.current && users.length > 0 && !forceRefresh) {
      console.log('✅ Users already loaded, returning cached data');
      return users;
    }

    console.log('📋 Fetching all users...', { forceRefresh });
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const q = query(usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);
      usersLoadedRef.current = true;
      console.log('✅ Users fetched successfully:', usersData.length, 'users');
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err.message);
      usersLoadedRef.current = false;
      throw err;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [users]);

  // Get user by their ID (not document ID)
  const getUserById = useCallback(async (userId) => {
    if (!userId) {
      console.warn('⚠️ No user ID provided');
      return null;
    }

    console.log('🔍 Fetching user by ID:', userId);

    try {
      const result = await findDocumentByUserId(userId);

      if (result) {
        const userData = {
          docId: result.docId,
          id: userId,
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
      throw err;
    }
  }, []);

  // Get users by role
  const getUsersByRole = useCallback(async (role) => {
    if (!role) {
      console.warn('⚠️ No role provided');
      return [];
    }

    console.log('🎭 Fetching users by role:', role);

    try {
      const q = query(
        usersCollection,
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${usersData.length} users with role: ${role}`);
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users by role:', err);
      throw err;
    }
  }, []);

  // Get users by organization
  const getUsersByOrganization = useCallback(async (orgId) => {
    if (!orgId) {
      console.warn('⚠️ No organization ID provided');
      return [];
    }

    console.log('🏢 Fetching users by organization:', orgId);

    try {
      const q = query(
        usersCollection,
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${usersData.length} users in organization: ${orgId}`);
      return usersData;
    } catch (err) {
      console.error('❌ Error fetching users by organization:', err);
      throw err;
    }
  }, []);

  // Create new user
  const createUser = useCallback(async (userData) => {
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
        id: docRef.id,
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
  }, []);

  // Update user by their ID
  const updateUser = useCallback(async (userId, userData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('📝 Updating user:', { userId, userData });

    try {
      // Prepare the update data
      const cleanedData = {
        ...userData,
        updatedAt: serverTimestamp()
      };

      // Process orgId if provided
      if ('orgId' in userData) {
        cleanedData.orgId = Array.isArray(userData.orgId)
          ? userData.orgId.map(Number)
          : userData.orgId ? [Number(userData.orgId)] : [];
      }

      // Get document reference
      const userRef = doc(db, 'users', String(userId));

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

      // Update current user if it's the same user
      if (currentUser && (currentUser.id === Number(userId) || currentUser.id === String(userId))) {
        setCurrentUser(prev => ({ ...prev, ...cleanedData, updatedAt: new Date() }));
      }

      console.log('✅ User updated successfully');
      return true;
    } catch (err) {
      console.error('❌ Error updating user:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser]);

  // Update current user (shorthand method)
  const updateCurrentUser = useCallback(async (userData) => {
    if (!currentUser || !currentUser.id) {
      throw new Error('No current user to update');
    }

    return await updateUser(currentUser.id, userData);
  }, [currentUser, updateUser]);

  // Delete user by their ID
  const deleteUser = useCallback(async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🗑️ Deleting user with ID:', userId);
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      let targetDocId = userId;

      if (!docSnap.exists()) {
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
  }, [currentUser]);

  // Update user status
  const updateUserStatus = useCallback(async (userId, status) => {
    if (!userId || !status) {
      throw new Error('User ID and status are required');
    }

    console.log('🔄 Updating user status:', userId, status);
    return await updateUser(userId, { status });
  }, [updateUser]);

  // Search users
  const searchUsers = useCallback((searchTerm) => {
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
  }, [users]);

  // Check if user exists
  const userExists = useCallback(async (userId) => {
    if (!userId) return false;

    try {
      const result = await findDocumentByUserId(userId);
      return result !== null;
    } catch (err) {
      console.error('❌ Error checking user existence:', err);
      return false;
    }
  }, []);

  // Force refresh function
  const refreshUsers = useCallback(() => {
    console.log('🔄 Force refreshing users...');
    usersLoadedRef.current = false;
    return getUsers(true);
  }, [getUsers]);

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
    searchUsers,
    userExists,
    refreshUsers
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};