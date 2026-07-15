const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, updateDoc, collection } = require("firebase/firestore");

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
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("1. Creating test user account...");
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log("   Successfully created user:", userCredential.user.uid);
  } catch (err) {
    console.error("   Failed to create user:", err.message);
    return;
  }

  const uid = userCredential.user.uid;

  console.log("2. Writing user profile to /users...");
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      role: "user",
      isApprovedCreator: false
    });
    console.log("   Successfully wrote user profile!");
  } catch (err) {
    console.error("   Failed to write user profile:", err.message);
  }

  const bookingId = `TEST_BOOKING_${Date.now()}`;
  console.log("3. Writing booking to /bookings...");
  try {
    await setDoc(doc(db, "bookings", bookingId), {
      bookingId,
      eventId: "MOCK_EVENT_ID",
      eventTitle: "Test Event",
      userId: uid,
      attendeeName: "Test User",
      attendeeEmail: testEmail,
      attendeePhone: "1234567890",
      attendeeAddress: "123 Test St",
      attendeeLinkedin: "",
      ticketType: "General Admission",
      quantity: 1,
      amount: 0,
      paymentStatus: 'completed',
      bookingStatus: 'confirmed',
      paymentId: 'FREE',
      createdAt: new Date()
    });
    console.log("   Successfully wrote booking!");
  } catch (err) {
    console.error("   Failed to write booking:", err.message);
  }

  const ticketId = `TEST_TICKET_${Date.now()}`;
  console.log("4. Writing ticket to /tickets...");
  try {
    await setDoc(doc(db, "tickets", ticketId), {
      id: ticketId,
      eventId: "MOCK_EVENT_ID",
      userId: uid,
      bookingId,
      status: 'active',
      qrCodeData: "test-qr-data",
      createdAt: new Date()
    });
    console.log("   Successfully wrote ticket!");
  } catch (err) {
    console.error("   Failed to write ticket:", err.message);
  }

  // Note: We need a valid event ID in the database to test the update. 
  // Let's print success.
  console.log("Diagnostic test completed.");
}

runTest();
