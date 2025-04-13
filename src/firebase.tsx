import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZsJyoAGQ87w3mUK-JfKIAvm5LOLQ8po4",
  authDomain: "campusfit-8468c.firebaseapp.com",
  projectId: "campusfit-8468c",
  storageBucket: "campusfit-8468c.firebasestorage.app",
  messagingSenderId: "266601164096",
  appId: "1:266601164096:web:b1e9b629c531ff21ef1ea5",
  measurementId: "G-M354MF7T5R"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
export { db };
export const auth = getAuth(app);