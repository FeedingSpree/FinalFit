// src/services/userLogsService.ts
import { db } from "../firebase.tsx";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// Reference to 'userlogs' collection
const userLogsCollectionRef = collection(db, "userlogs");

// Create a new log
export const addUserLog = async (log: {
  log_id: string;
  action: string;
  timestamp: Date;
  user_id: string;
}) => {
  try {
    await addDoc(userLogsCollectionRef, log);
    console.log("User log added!");
  } catch (e) {
    console.error("Error adding user log: ", e);
  }
};

// Get all logs
export const getUserLogs = async () => {
  try {
    const data = await getDocs(userLogsCollectionRef);
    return data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  } catch (e) {
    console.error("Error getting user logs: ", e);
    return [];
  }
};

// Update a log
export const updateUserLog = async (id: string, updatedLog: {
  log_id: string;
  action: string;
  timestamp: Date;
  user_id: string;
}) => {
  try {
    const logDoc = doc(db, "userlogs", id);
    await updateDoc(logDoc, updatedLog);
    console.log("User log updated!");
  } catch (e) {
    console.error("Error updating user log: ", e);
  }
};

// Delete a log
export const deleteUserLog = async (id: string) => {
  try {
    const logDoc = doc(db, "userlogs", id);
    await deleteDoc(logDoc);
    console.log("User log deleted!");
  } catch (e) {
    console.error("Error deleting user log: ", e);
  }
};
