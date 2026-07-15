const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBvShPJS8cgZyTFlAS8tHN2JAEi1ETlaxg",
  authDomain: "event-management-dc1f4.firebaseapp.com",
  projectId: "event-management-dc1f4",
  storageBucket: "event-management-dc1f4.firebasestorage.app",
  messagingSenderId: "956626661536",
  appId: "1:956626661536:web:57bdd88e43a4aad23399c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnose() {
  try {
    console.log("Fetching users from Firestore...");
    const snap = await getDocs(collection(db, "users"));
    console.log(`Found ${snap.size} users:`);
    snap.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error("Diagnosis failed:", error);
  }
}

diagnose();
