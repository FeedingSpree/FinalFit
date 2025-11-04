/**
 * studentConcernsService.ts
 * 
 * Handles all Firebase CRUD operations for:
 *  - studentConcerns (add, get, update, delete)
 *  - gadgetRequests (add, get, admin get)
 * 
 * Also includes helper functions and category list.
 */

import { db } from "../firebase.tsx";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";

/* ===========================================
   🎓 STUDENT CONCERNS COLLECTION
   =========================================== */

/**
 * Add a new student concern document.
 */
export const addStudentConcern = async (concernData: Record<string, any>) => {
  try {
    const docRef = await addDoc(collection(db, "studentConcerns"), concernData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding student concern:", error);
    throw error;
  }
};

/**
 * Get all concerns (for admin/management view).
 */
export const getStudentConcerns = async () => {
  try {
    const snapshot = await getDocs(collection(db, "studentConcerns"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all student concerns:", error);
    throw error;
  }
};

/**
 * Get concerns by student ID (for student view).
 */
export const getStudentConcernsByStudent = async (studentId: string) => {
  try {
    const q = query(collection(db, "studentConcerns"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching student concerns:", error);
    throw error;
  }
};

/**
 * Update an existing student concern document.
 */
export const updateStudentConcern = async (concernId: string, updatedData: Record<string, any>) => {
  try {
    const docRef = doc(db, "studentConcerns", concernId);
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating student concern:", error);
    throw error;
  }
};

/**
 * Delete a student concern document.
 */
export const deleteStudentConcern = async (concernId: string) => {
  try {
    const docRef = doc(db, "studentConcerns", concernId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting student concern:", error);
    throw error;
  }
};

/**
 * Static list of concern categories.
 */
export const getConcernCategories = () => {
  return [
    "Facility Issue",
    "Academic Concern",
    "Behavioral Concern",
    "Other",
  ];
};

/* ===========================================
   💻 GADGET REQUESTS COLLECTION
   =========================================== */

/**
 * Add a new gadget request document.
 */
export const addGadgetRequest = async (gadgetData: Record<string, any>) => {
  try {
    const docRef = await addDoc(collection(db, "gadgetRequests"), gadgetData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding gadget request:", error);
    throw error;
  }
};

/**
 * Get gadget requests by student (student view).
 */
export const getGadgetRequestsByStudent = async (studentId: string) => {
  try {
    const q = query(collection(db, "gadgetRequests"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching gadget requests:", error);
    throw error;
  }
};

/**
 * Get all gadget requests (admin/OSA view).
 */
export const getAllGadgetRequests = async () => {
  try {
    const snapshot = await getDocs(collection(db, "gadgetRequests"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all gadget requests:", error);
    throw error;
  }
};
