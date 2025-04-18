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
    try {
        const violationLog = {
            building_number: log.building_number,
            camera_number: log.camera_number,
            date: log.date,
            floor_number: log.floor_number,
            time: log.time,
            violation: log.violation,
            violation_id: log.violation_id
        };
        
        await addDoc(collectionRef, violationLog);
        return violationLog;
    } catch (error) {
        console.error("Error adding violation log:", error);
        throw error;
    }
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
