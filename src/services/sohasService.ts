// src/services/sohasService.ts
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
  } from "firebase/firestore";
  import { db } from "../firebase.tsx"; // make sure your Firebase config is correctly exported from here
  
  const sohasCollection = collection(db, "sohas");
  
  // Convert JS Date to Firestore Timestamp
  const convertDatesToTimestamp = (data: any) => {
    const converted = { ...data };
    if (data.birthdate instanceof Date) {
      converted.birthdate = Timestamp.fromDate(data.birthdate);
    }
    if (data.date_started instanceof Date) {
      converted.date_started = Timestamp.fromDate(data.date_started);
    }
    return converted;
  };
  
  // Convert Firestore Timestamp to JS Date
  const convertTimestampsToDate = (docData: any) => {
    const birthdate = docData.birthdate?.toDate ? docData.birthdate.toDate() : null;
    const date_started = docData.date_started?.toDate ? docData.date_started.toDate() : null;
  
    return {
      ...docData,
      birthdate,
      date_started,
    };
  };
  
  export const getSohas = async () => {
    const snapshot = await getDocs(sohasCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestampsToDate(doc.data()),
    }));
  };
  
  export const addSohas = async (data: any) => {
    const prepared = convertDatesToTimestamp(data);
    await addDoc(sohasCollection, prepared);
  };
  
  export const updateSohas = async (id: string, data: any) => {
    const sohasRef = doc(db, "sohas", id);
    const prepared = convertDatesToTimestamp(data);
    await updateDoc(sohasRef, prepared);
  };
  
  export const deleteSohas = async (id: string) => {
    const sohasRef = doc(db, "sohas", id);
    await deleteDoc(sohasRef);
  };
  