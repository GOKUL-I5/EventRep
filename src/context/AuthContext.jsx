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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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

      const isAdminEmail = data.email.toLowerCase() === 'gokulmadara.1@gmail.com';
      const userDoc = {
        uid: user.uid,
        firstName: isAdminEmail ? 'gokul' : (data.firstName || ''),
        lastName: isAdminEmail ? '' : (data.lastName || ''),
        username: isAdminEmail ? 'gokul' : (data.username || ''),
        email: data.email,
        mobileNumber: data.mobileNumber || '',
        dob: data.dob || '',
        gender: data.gender || '',
        bio: '',
        location: '',
        socialLinks: { twitter: '', linkedin: '', github: '' },
        photoURL: photoURL,
        createdAt: serverTimestamp(),
        role: isAdminEmail ? 'super_admin' : 'user',
        isApprovedCreator: isAdminEmail ? true : false
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
    
    const isAdminEmail = user.email.toLowerCase() === 'gokulmadara.1@gmail.com';
    if (!docSnap.exists()) {
      const userDoc = {
        uid: user.uid,
        firstName: isAdminEmail ? 'gokul' : (user.displayName?.split(' ')[0] || ''),
        lastName: isAdminEmail ? '' : (user.displayName?.split(' ').slice(1).join(' ') || ''),
        username: isAdminEmail ? 'gokul' : user.email.split('@')[0],
        email: user.email,
        bio: '',
        location: '',
        socialLinks: { twitter: '', linkedin: '', github: '' },
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        role: isAdminEmail ? 'super_admin' : 'user',
        isApprovedCreator: isAdminEmail ? true : false
      };
      await setDoc(docRef, userDoc);
      setUserData(userDoc);
    } else {
      const existingData = docSnap.data();
      if (isAdminEmail && (existingData.role !== 'super_admin' || !existingData.isApprovedCreator || existingData.firstName !== 'gokul')) {
        const updates = { role: 'super_admin', isApprovedCreator: true, firstName: 'gokul', lastName: '', username: 'gokul' };
        await updateDoc(docRef, updates);
        setUserData({ ...existingData, ...updates });
      } else {
        setUserData(existingData);
      }
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
    let unsubscribeUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Clean up previous snapshot listener if it exists
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        const docRef = doc(db, "users", user.uid);
        const isAdminEmail = user.email.toLowerCase() === 'gokulmadara.1@gmail.com';

        // Listen for real-time changes to the user's Firestore document
        unsubscribeUserDoc = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const existingData = docSnap.data();
            
            // Auto-promote hardcoded admin email if needed
            if (isAdminEmail && (existingData.role !== 'super_admin' || !existingData.isApprovedCreator || existingData.firstName !== 'gokul')) {
              const updates = { role: 'super_admin', isApprovedCreator: true, firstName: 'gokul', lastName: '', username: 'gokul' };
              await updateDoc(docRef, updates);
              setUserData({ ...existingData, ...updates });
            } else {
              setUserData(existingData);
            }
          } else {
            // Document doesn't exist yet, check if it's the admin logging in for the first time
            if (isAdminEmail) {
              const userDoc = {
                uid: user.uid,
                firstName: 'gokul',
                lastName: '',
                username: 'gokul',
                email: user.email,
                bio: '',
                location: '',
                socialLinks: { twitter: '', linkedin: '', github: '' },
                photoURL: user.photoURL || '',
                createdAt: serverTimestamp(),
                role: 'super_admin',
                isApprovedCreator: true
              };
              await setDoc(docRef, userDoc);
              setUserData(userDoc);
            } else {
              setUserData(null);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document: ", error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
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
