import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
} from "firebase/firestore";
import { db2 } from "../firebase.tsx";

const collectionRef = collection(db2, "reviewlogs");

export const addReviewLog = async (log: any) => {
    try {
        const reviewLog = {
            camera_number: log.camera_number,
            date: log.date,
            time: log.time,
            violation: log.violation,
            violation_id: log.violation_id,
            status: "Pending",
            url: log.url,
            confidence: log.confidence
        };
        
        const docRef = await addDoc(collectionRef, reviewLog);
        return {
            id: docRef.id,
            ...reviewLog
        };
    } catch (error) {
        console.error("Error adding review log:", error);
        throw error;
    }
};
export const getReviewLogs = async () => {
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting review logs:", error);
        return [];
    }
};

export const updateReviewLog = async (id: string, updatedLog: any) => {
    const logRef = doc(db2, "reviewlogs", id);
    await updateDoc(logRef, {
        ...updatedLog
    });
};

export const deleteReviewLog = async (id: string) => {
    await deleteDoc(doc(db2, "reviewlogs", id));
};

