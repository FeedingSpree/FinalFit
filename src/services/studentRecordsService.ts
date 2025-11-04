import { db } from "../firebase.tsx";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

const studentRecordsCollectionRef = collection(db, "studentrecords");

// ✅ Fetch all gadget requests
export const getAllGadgetRequests = async () => {
  const querySnapshot = await getDocs(collection(db, "gadgetRequests"));
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// ✅ Update gadget request status or notes
export const updateGadgetRequest = async (id: string, data: Record<string, any>) => {
  const docRef = doc(db, "gadgetRequests", id);
  await updateDoc(docRef, data);
};
export const addStudentRecord = async (log: {
    name: string;
    program: string;
    yearLevel: string;
    violation: string;
    date: string;
    department: string; 
    studentNumber: string;
    violation_id: string;
    imageUrl: string;
}) => {
    try {
        await addDoc(studentRecordsCollectionRef, log);
        console.log("Student record added!");
    } catch (e) {
        console.error("Error adding student record: ", e);
    }
}

export const getStudentRecords = async () => {
    try {
        const data = await getDocs(studentRecordsCollectionRef);
        return data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
    } catch (e) {
        console.error("Error getting student records: ", e);
        return [];
    }
};

export const updateStudentRecord = async (id: string, updatedRecord: {
    name: string;
    program: string;
    yearlevel: string;
    violation: string;
    date: string;
    department: string;
}) => {
    try {
        const recordDoc = doc(db, "studentrecords", id);
        await updateDoc(recordDoc, updatedRecord);
        console.log("Student record updated!");
    } catch (e) {
        console.error("Error updating student record: ", e);
    }
}

export const deleteStudentRecord = async (id: string) => {
    try {
        const recordDoc = doc(db, "studentrecords", id);
        await deleteDoc(recordDoc);
        console.log("Student record deleted!");
    } catch (e) {
        console.error("Error deleting student record: ", e);
    }
}