// src/services/managementService.js
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.tsx";
import { Timestamp } from "firebase/firestore";

const toTimestamp = (datetime) => Timestamp.fromDate(new Date(datetime));

const collectionRef = collection(db, "managements");

export const addManagement = async (management) => {
  await addDoc(collectionRef, management);
};

export const getManagements = async () => {
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateManagement = async (id, updatedData) => {
  const docRef = doc(db, "managements", id);
  await updateDoc(docRef, updatedData);
};

export const deleteManagement = async (id) => {
  const docRef = doc(db, "managements", id);
  await deleteDoc(docRef);
};
