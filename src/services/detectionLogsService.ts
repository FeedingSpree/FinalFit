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
    try {
        const detectionLog = {
            camera_number: log.camera_number,
            date: log.date,
            time: log.time,
            detection: log.detection,
            detection_id: log.detection_id,
            status: log.status,
            url: log.url,
            confidence: log.confidence
        };
        await addDoc(collectionRef, detectionLog);
        return detectionLog;
    } catch (error) {
        console.error("Error adding detection log:", error);
        throw error;
    }
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
        ...updatedLog
    });
};

export const deleteDetectionLog = async (id: string) => {
    await deleteDoc(doc(db, "nonviolationlogs", id));
};