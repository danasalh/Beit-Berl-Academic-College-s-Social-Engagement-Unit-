// src/components/QuickTest.jsx
// A quick and simple test component for immediate testing

import React from 'react';
import { useUsers } from '../Contexts/UsersContext';

const QuickTest = () => {
  const { 
    users, 
    loading, 
    error, 
    getUsers, 
    createUser 
  } = useUsers();

  const testBasicFunctions = async () => {
    console.log('🚀 Starting quick test...');
    
    // Test 1: Get Users
    console.log('Test 1: Getting users...');
    try {
      await getUsers();
      console.log('✅ Get users successful');
    } catch (err) {
      console.error('❌ Get users failed:', err);
    }
    
    // Test 2: Create User
    console.log('Test 2: Creating test user...');
    try {
      await createUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        orgId: 'test-org'
      });
      console.log('✅ Create user successful');
    } catch (err) {
      console.error('❌ Create user failed:', err);
    }
    
    console.log('🏁 Quick test completed! Check console and Firestore.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🧪 Quick Context Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Current State:</strong></p>
        <ul>
          <li>Loading: {loading ? 'Yes' : 'No'}</li>
          <li>Error: {error || 'None'}</li>
          <li>Users Count: {users.length}</li>
        </ul>
      </div>
      
      <button 
        onClick={testBasicFunctions}
        disabled={loading}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {loading ? 'Testing...' : '🚀 Run Quick Test'}
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>This will:</p>
        <ol>
          <li>Fetch all users from Firestore</li>
          <li>Create a test user</li>
          <li>Log results to browser console</li>
        </ol>
        <p><strong>Check your browser console and Firebase Firestore database!</strong></p>
      </div>
      
      {users.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Users in state:</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QuickTest;