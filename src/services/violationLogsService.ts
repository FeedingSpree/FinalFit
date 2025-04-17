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
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting violation logs:", error);
        return [];
    }
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
