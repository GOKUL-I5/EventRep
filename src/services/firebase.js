import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvShPJS8cgZyTFlAS8tHN2JAEi1ETlaxg",
  authDomain: "event-management-dc1f4.firebaseapp.com",
  projectId: "event-management-dc1f4",
  storageBucket: "event-management-dc1f4.firebasestorage.app",
  messagingSenderId: "956626661536",
  appId: "1:956626661536:web:57bdd88e43a4aad23399c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
