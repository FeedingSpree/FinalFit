// src/services/userService.ts
import { db } from "../firebase.tsx";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// Reference to the 'users' collection in Firestore
const usersCollectionRef = collection(db, "users");

// Create a new user
export const addUser = async (user: {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  loa: string;
}) => { 
  try {
    await addDoc(usersCollectionRef, user);
    console.log("User added!");
  } catch (e) {
    console.error("Error adding user: ", e);
  }
};

// Get all users
export const getUsers = async () => {
  try {
    const data = await getDocs(usersCollectionRef);
    const users = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id, // Save the document ID to use in updates and deletes
    })); 
    return users;
  } catch (e) {
    console.error("Error getting users: ", e);
    return [];
  }
};

// Update a user
export const updateUser = async (id: string, updatedUser: {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  loa: string;
}) => {
  try {
    const userDoc = doc(db, "users", id);
    await updateDoc(userDoc, updatedUser);
    console.log("User updated!");
  } catch (e) {
    console.error("Error updating user: ", e);
  }
};

// Delete a user
export const deleteUser = async (id: string) => {
  try {
    const userDoc = doc(db, "users", id);
    await deleteDoc(userDoc);
    console.log("User deleted!");
  } catch (e) {
    console.error("Error deleting user: ", e);
  }
};
