import { db } from "../firebase.tsx";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, Timestamp, query, where } from "firebase/firestore";

const collectionRef = collection(db, "studentConcerns");

export interface StudentConcern {
  id?: string;
  studentId: string;
  studentName: string;
  category: string;
  description: string;
  photoUrl?: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  dateSubmitted: string;
  timeSubmitted: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

export const addStudentConcern = async (
  concern: Omit<StudentConcern, 'id' | 'status' | 'dateSubmitted' | 'timeSubmitted' | 'studentId' | 'studentName'>
) => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const concernData: Omit<StudentConcern, 'id'> = {
      ...concern,
      studentId: user.user_id, // ✅ correct mapping
      studentName: `${user.first_name || ''} ${user.last_name || ''}`.trim(), // ✅ build name
      status: 'Pending',
      dateSubmitted: new Date().toISOString().split('T')[0],
      timeSubmitted: new Date().toTimeString().split(' ')[0],
    };

    const docRef = await addDoc(collectionRef, concernData);
    return {
      id: docRef.id,
      ...concernData,
    };
  } catch (error) {
    console.error("Error adding student concern:", error);
    throw error;
  }
};



export const getStudentConcerns = async (): Promise<StudentConcern[]> => {
  try {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as StudentConcern[];
  } catch (error) {
    console.error("Error getting student concerns:", error);
    return [];
  }
};

export const updateStudentConcern = async (id: string, updatedConcern: Partial<StudentConcern>) => {
  try {
    const concernRef = doc(db, "studentConcerns", id);
    await updateDoc(concernRef, updatedConcern);
    console.log("Student concern updated successfully");
  } catch (error) {
    console.error("Error updating student concern:", error);
    throw error;
  }
};

export const deleteStudentConcern = async (id: string) => {
  try {
    const concernRef = doc(db, "studentConcerns", id);
    await deleteDoc(concernRef);
    console.log("Student concern deleted successfully");
  } catch (error) {
    console.error("Error deleting student concern:", error);
    throw error;
  }
};


export const getStudentConcernsByStudent = async (studentId: string): Promise<StudentConcern[]> => {
  try {
    const q = query(collectionRef, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as StudentConcern[];
  } catch (error) {
    console.error("Error getting student concerns by student:", error);
    return [];
  }
};


export const getConcernCategories = () => {
  return [
    'Academic Issues',
    'Facility Problems',
    'Dress Code Violation',
    'Bullying/Harassment',
    'Safety Concerns',
    'Food Services',
    'Transportation',
    'Technology Issues',
    'Other'
  ];
};