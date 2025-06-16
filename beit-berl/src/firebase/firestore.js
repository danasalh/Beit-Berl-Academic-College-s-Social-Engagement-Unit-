// src/firebase/firestore.js
import { db } from './config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  orderBy
} from 'firebase/firestore';

// Collection reference
const testingCollection = collection(db, 'testing');

// Create - Add a new document
export const addItem = async (data) => {
  try {
    const docRef = await addDoc(testingCollection, {
      ...data,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Read - Get all documents
export const getAllItems = async () => {
  try {
    const querySnapshot = await getDocs(testingCollection);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    throw error;
  }
};

// Read - Get a specific document
export const getItemById = async (id) => {
  try {
    const docRef = doc(db, 'testing', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document does not exist");
    }
  } catch (error) {
    throw error;
  }
};

// Update - Update a document
export const updateItem = async (id, data) => {
  try {
    const docRef = doc(db, 'testing', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

// Delete - Delete a document
export const deleteItem = async (id) => {
  try {
    const docRef = doc(db, 'testing', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// Query - Filter documents (example)
export const queryItems = async (field, operator, value) => {
  try {
    const q = query(testingCollection, where(field, operator, value));
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    throw error;
  }
};