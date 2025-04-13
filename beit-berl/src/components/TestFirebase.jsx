// src/components/TestFirebase.jsx
import React, { useState, useEffect } from 'react';
import { addItem, getAllItems, updateItem, deleteItem } from '../firebase/firestore';

const TestFirebase = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all items on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getAllItems();
        setItems(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching items: ' + err.message);
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // Add new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const id = await addItem(newItem);
      const addedItem = { id, ...newItem, createdAt: new Date() };
      setItems((prev) => [...prev, addedItem]);
      setNewItem({ name: '', description: '' });
      setLoading(false);
    } catch (err) {
      setError('Error adding item: ' + err.message);
      setLoading(false);
    }
  };

  // Update item
  const handleUpdateItem = async (id, updatedData) => {
    try {
      setLoading(true);
      await updateItem(id, updatedData);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedData, updatedAt: new Date() } : item))
      );
      setLoading(false);
    } catch (err) {
      setError('Error updating item: ' + err.message);
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    try {
      setLoading(true);
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setLoading(false);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      setLoading(false);
    }
  };

  if (loading && items.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Firebase Testing</h2>
      
      {/* Add new item form */}
      <form onSubmit={handleAddItem}>
        <div>
          <input
            type="text"
            name="name"
            placeholder="Item name"
            value={newItem.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <textarea
            name="description"
            placeholder="Item description"
            value={newItem.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          Add Item
        </button>
      </form>

      {/* Display items */}
      <div>
        <h3>Items from Firestore:</h3>
        {items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <button
                  onClick={() =>
                    handleUpdateItem(item.id, {
                      name: `${item.name} (Updated)`,
                    })
                  }
                >
                  Update
                </button>
                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TestFirebase;