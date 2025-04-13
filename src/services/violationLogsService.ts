// src/services/violationLogsService.ts
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
  } from "firebase/firestore";
  import { db } from "../firebase.tsx";
  
  const collectionRef = collection(db, "violationlogs");
  
  export const addViolationLog = async (log: any) => {
    const newLog = {
      ...log,
      timestamp: Timestamp.fromDate(new Date(log.timestamp)),
    };
    await addDoc(collectionRef, newLog);
  };
  
  export const getViolationLogs = async () => {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  };
  
  export const updateViolationLog = async (id: string, updatedLog: any) => {
    const logRef = doc(db, "violationlogs", id);
    await updateDoc(logRef, {
      ...updatedLog,
      timestamp: Timestamp.fromDate(new Date(updatedLog.timestamp)),
    });
  };
  
  export const deleteViolationLog = async (id: string) => {
    await deleteDoc(doc(db, "violationlogs", id));
  };
  