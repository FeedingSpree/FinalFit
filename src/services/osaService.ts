// src/services/osaService.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.tsx";

const osaCollectionRef = collection(db, "osa");

export const getOsas = async () => {
  const snapshot = await getDocs(osaCollectionRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addOsa = async (osaData) => {
  await addDoc(osaCollectionRef, osaData);
};

export const updateOsa = async (id, updatedData) => {
  const osaDoc = doc(db, "osas", id);
  await updateDoc(osaDoc, updatedData);
};

export const deleteOsa = async (id) => {
  const osaDoc = doc(db, "osas", id);
  await deleteDoc(osaDoc);
};
