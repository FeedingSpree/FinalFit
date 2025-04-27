// src/services/calendarService.ts
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db } from "../firebase.tsx";

const collectionRef = collection(db, "calendar");

export const addCalendarEvent = async (event: any) => {
    // Remove timestamp handling - we don't need it for calendar events
    await addDoc(collectionRef, event);
};

export const getCalendarEvents = async () => {
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting calendar events:", error);
        return [];
    }
};

export const updateCalendarEvent = async (id: string, updatedEvent: any) => {
    const eventRef = doc(db, "calendar", id);
    await updateDoc(eventRef, {
        ...updatedEvent,
    });
};

export const deleteCalendarEvent = async (id: string) => {
    await deleteDoc(doc(db, "calendar", id));
}