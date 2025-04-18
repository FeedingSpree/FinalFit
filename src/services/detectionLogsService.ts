// src/services/detectionLogsService.ts
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

const collectionRef = collection(db, "nonviolationlogs");

export const addDetectionLog = async (log: any) => {
    const newLog = {
        ...log,
        timestamp: Timestamp.fromDate(new Date(log.timestamp)),
    };
    await addDoc(collectionRef, newLog);
};

export const getDetectionLogs = async () => {
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting detection logs:", error);
        return [];
    }
}

export const updateDetectionLog = async (id: string, updatedLog: any) => {
    const logRef = doc(db, "nonviolationlogs", id);
    await updateDoc(logRef, {
        ...updatedLog,
        timestamp: Timestamp.fromDate(new Date(updatedLog.timestamp)),
    });
};

export const deleteDetectionLog = async (id: string) => {
    await deleteDoc(doc(db, "nonviolationlogs", id));
};