import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // Firestore data
  const [loading, setLoading] = useState(true);

  // Extended signup with details & photo
  async function signupWithDetails(data, file) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      let photoURL = "";

      if (file) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        photoURL = await getDownloadURL(uploadTask.ref);
      }

      const userDoc = {
        uid: user.uid,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        username: data.username || '',
        email: data.email,
        mobileNumber: data.mobileNumber || '',
        dob: data.dob || '',
        gender: data.gender || '',
        bio: '',
        location: '',
        socialLinks: { twitter: '', linkedin: '', github: '' },
        photoURL: photoURL,
        createdAt: serverTimestamp(),
        role: 'user'
      };

      await setDoc(doc(db, "users", user.uid), userDoc);
      setUserData(userDoc);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function updateUserDetails(updatedData, file) {
    if (!currentUser) throw new Error("No user logged in");
    
    let photoURL = userData?.photoURL || "";
    
    if (file) {
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}_${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      photoURL = await getDownloadURL(uploadTask.ref);
    }

    const docRef = doc(db, "users", currentUser.uid);
    const updates = {
      ...updatedData,
      photoURL,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updates);
    setUserData(prev => ({ ...prev, ...updates }));
  }

  function updateUserPassword(newPassword) {
    if (!currentUser) throw new Error("No user logged in");
    return updatePassword(currentUser, newPassword);
  }

  async function login(email, password, rememberMe) {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const userDoc = {
        uid: user.uid,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        username: user.email.split('@')[0],
        email: user.email,
        bio: '',
        location: '',
        socialLinks: { twitter: '', linkedin: '', github: '' },
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        role: 'user'
      };
      await setDoc(docRef, userDoc);
      setUserData(userDoc);
    } else {
      setUserData(docSnap.data());
    }
    return result;
  }

  function logout() {
    setUserData(null);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function verifyEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signupWithDetails,
    updateUserDetails,
    updateUserPassword,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    verifyEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
