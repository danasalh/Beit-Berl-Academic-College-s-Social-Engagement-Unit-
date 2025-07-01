// src/utils/firebaseErrorHandling.js

import { db } from '../firebase/config';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Exponential backoff retry logic
export const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt + 1} failed:`, err);
      
      // Check if it's a recoverable error
      if (!isRecoverableError(err)) {
        throw err;
      }
      
      // Wait with exponential backoff before retrying
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Check if error is recoverable
export const isRecoverableError = (error) => {
  // Common Firestore error codes that can be retried
  const recoverableCodes = [
    'deadline-exceeded',
    'unavailable',
    'internal',
    'resource-exhausted',
    'network-request-failed'
  ];
  
  return (
    recoverableCodes.includes(error?.code) ||
    error?.message?.includes('WebChannelConnection') ||
    error?.message?.includes('stream transport error') ||
    error?.message?.includes('Failed to get document')
  );
};

// Reset Firestore connection
export const resetFirestoreConnection = async () => {
  try {
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await enableNetwork(db);
  } catch (err) {
    console.error('❌ Error resetting Firestore connection:', err);
    throw err;
  }
};

// Wrapper for Firestore operations with automatic retry and connection reset
export const withFirestoreRetry = async (operation, context) => {
  try {
    return await retryOperation(operation);
  } catch (err) {
    if (isRecoverableError(err)) {
      // Try resetting connection and retry once more
      await resetFirestoreConnection();
      return await retryOperation(operation, 1);
    }
    throw err;
  }
};
