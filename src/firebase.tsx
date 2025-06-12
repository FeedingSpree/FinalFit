import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzMzh05dp0Fc9nZaVFQhDOl81w7jDSH4o",
  authDomain: "campusfit-557ab.firebaseapp.com",
  projectId: "campusfit-557ab",
  storageBucket: "campusfit-557ab.firebasestorage.app",
  messagingSenderId: "676710185021",
  appId: "1:676710185021:web:31dd093cd6a0dc64645254",
  measurementId: "G-HHSBDQGG6V"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const firebaseConfig2 = {
  apiKey: "AIzaSyCqiknxbbZZbAYXMdAgLmAJj2kTYrgVyC8",
  authDomain: "collider-8069d.firebaseapp.com",
  projectId: "collider-8069d",
  storageBucket: "collider-8069d.firebasestorage.app",
  messagingSenderId: "423101038207",
  appId: "1:423101038207:web:322323fc8087b0d38c894a",
  measurementId: "G-PQJ1DK1KJR"
};

const app2 = initializeApp(firebaseConfig2, "secondary");
const db2 = getFirestore(app2);


export { db };
export { db2 };
export const auth1 = getAuth(app);
export const auth2 = getAuth(app2);