import React, { useState, useEffect } from 'react';
import { 
  loginWithEmailAndPassword, 
  signInWithGoogle,
  logOut,
  authStateObserver
} from '../../firebase/auth';
import { addItem, updateItem, deleteItem, getAllItems } from '../../firebase/firestore'; // Assuming these functions exist
import RegisterComponent from '../pages/auth/Register/Register';

const AuthComponent = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(undefined); // Start with undefined to differentiate loading state
  const [showRegister, setShowRegister] = useState(false);
  const [items, setItems] = useState([]); // State to manage items
  const [newItem, setNewItem] = useState({ name: '', description: '' }); // State for new item
  const [editingItem, setEditingItem] = useState(null); // State to track the item being edited

  // Monitor auth state
  useEffect(() => {
    console.log("Setting up auth observer");
    const unsubscribe = authStateObserver((user) => {
      console.log("Auth state changed:", user); // Debugging log
      setCurrentUser(user || null); // Update state based on user
      if (user) fetchItems(); // Fetch items when logged in
    });

    return () => {
      console.log("Cleaning up auth observer");
      unsubscribe();
    };
  }, []);

  // Fallback for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentUser === undefined) {
        console.warn("Authentication state is taking too long to resolve.");
        setCurrentUser(null); // Fallback to logged-out state
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timeout);
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      await loginWithEmailAndPassword(email, password);
      console.log("Login successful"); // Debugging log
    } catch (err) {
      console.error("Login error:", err); // Debugging log
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      console.log("Google Sign-In successful"); // Debugging log
    } catch (err) {
      console.error("Google Sign-In error:", err); // Debugging log
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    console.log("Attempting to log out"); // Debugging log
    setError(null);
    try {
      await logOut();
      console.log("Logout successful"); // Debugging log
      setCurrentUser(null); // Ensure state is updated immediately
      setItems([]); // Clear items on logout
      console.log("currentUser after logout:", currentUser); // Debugging log
    } catch (err) {
      console.error("Logout error:", err); // Debugging log
      setError(err.message);
    }
  };

  // Fetch all items
  const fetchItems = async () => {
    try {
      const fetchedItems = await getAllItems(); // Assuming this function fetches all items
      setItems(fetchedItems);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const id = await addItem(newItem); // Assuming this function adds an item
      setItems([...items, { id, ...newItem }]);
      setNewItem({ name: '', description: '' });
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const handleUpdateItem = async (id, updatedData) => {
    try {
      await updateItem(id, updatedData); // Assuming this function updates an item
      setItems(items.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
      setEditingItem(null); // Exit edit mode after updating
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) {
      return; // If the user cancels, do nothing
    }

    try {
      await deleteItem(id); // Assuming this function deletes an item
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  console.log("Rendering AuthComponent, currentUser:", currentUser); // Debugging log

  if (currentUser === undefined) {
    return <div>Loading authentication...</div>;
  }

  if (showRegister) {
    return <RegisterComponent onBackToLogin={() => setShowRegister(false)} />;
  }

  return currentUser !== null ? (
    <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
      <p>Logged in as: {currentUser.email}</p>
      <button 
        style={{ padding: "5px 10px", background: "red", color: "white" }}
        onClick={handleLogout}
      >
        Logout
      </button>

      <h3>Manage Items</h3>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Item description"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          required
        />
        <button type="submit">Add Item</button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {editingItem === item.id ? (
              <div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, name: e.target.value } : i
                    ))
                  }
                />
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    setItems(items.map((i) =>
                      i.id === item.id ? { ...i, description: e.target.value } : i
                    ))
                  }
                />
                <button onClick={() => handleUpdateItem(item.id, { name: item.name, description: item.description })}>
                  Save
                </button>
                <button onClick={() => setEditingItem(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <strong>{item.name}</strong>: {item.description}
                <button onClick={() => setEditingItem(item.id)}>Edit</button>
                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div className="auth-container">
      <h2>Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      
      <button onClick={handleGoogleSignIn} className="google-button">
        Sign in with Google
      </button>
      
      <p>
        Need an account? 
        <button 
          className="switch-auth-mode" 
          onClick={() => setShowRegister(true)}
        >
          Register
        </button>
      </p>
    </div>
  );
};

export default AuthComponent;