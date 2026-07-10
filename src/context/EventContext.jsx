import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove, runTransaction, onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from './AuthContext';
import { seedDatabase } from '../utils/seeder';

const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const EventContext = createContext();

export const useEvent = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch events globally based on role
  useEffect(() => {
    setLoadingEvents(true);
    
    if (currentUser && currentUser.role === 'admin') {
      // Admins see all events, ordered by createdAt desc in memory to avoid index requirements if any filter is added later.
      const q = query(collection(db, "events"));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        if (querySnapshot.empty && !isSeeding) {
          setIsSeeding(true);
          try {
            await seedDatabase();
          } catch (error) {
            console.error("Auto-seed failed:", error);
          } finally {
            setIsSeeding(false);
          }
          return;
        }

        let fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedEvents.sort((a, b) => {
          const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
          return timeB - timeA;
        });

        setEvents(fetchedEvents);
        setLoadingEvents(false);
      }, (error) => {
        console.error("Error fetching admin events: ", error);
        setLoadingEvents(false);
      });

      return () => unsubscribe();
    } else {
      // Non-admins see all approved and pending events, plus their own created events (draft, pending, etc.)
      const qApproved = query(collection(db, "events"), where("status", "in", ["approved", "pending"]));
      
      let approvedEvents = [];
      let myEvents = [];

      const updateCombinedEvents = () => {
        const mergedMap = new Map();
        approvedEvents.forEach(ev => mergedMap.set(ev.id, ev));
        myEvents.forEach(ev => mergedMap.set(ev.id, ev));

        const combined = Array.from(mergedMap.values());
        combined.sort((a, b) => {
          const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
          return timeB - timeA;
        });

        setEvents(combined);
        setLoadingEvents(false);
      };

      const unsubscribeApproved = onSnapshot(qApproved, async (querySnapshot) => {
        if (querySnapshot.empty && !isSeeding && !currentUser) {
          setIsSeeding(true);
          try {
            await seedDatabase();
          } catch (error) {
            console.error("Auto-seed failed:", error);
          } finally {
            setIsSeeding(false);
          }
          return;
        }

        approvedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCombinedEvents();
      }, (error) => {
        console.error("Error fetching approved events: ", error);
        setLoadingEvents(false);
      });

      let unsubscribeMyEvents = () => {};
      if (currentUser) {
        const qMyEvents = query(collection(db, "events"), where("organizerId", "==", currentUser.uid));
        unsubscribeMyEvents = onSnapshot(qMyEvents, (querySnapshot) => {
          myEvents = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(ev => ev.status !== 'deleted');
          updateCombinedEvents();
        }, (error) => {
          console.error("Error fetching my events: ", error);
        });
      }

      return () => {
        unsubscribeApproved();
        unsubscribeMyEvents();
      };
    }
  }, [currentUser]);

  // Fetch tickets whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchMyTickets();
    } else {
      setMyTickets([]);
    }
  }, [currentUser]);

  // Keep fetchEvents for compatibility if any component calls it manually
  const fetchEvents = async () => {
    // Handled by onSnapshot now
  };

  // Fetch a specific event by ID
  const getEventById = async (eventId) => {
    try {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'deleted') return null;
        return { id: docSnap.id, ...data };
      }
      return null;
    } catch (error) {
      throw error;
    }
  };

  // Create an event
  const createEvent = async (eventData, imageFile, galleryFiles = []) => {
    if (!currentUser) throw new Error("Must be logged in to create event");
    
    try {
      const eventRef = doc(collection(db, "events"));
      let imageUrl = "";
      const galleryUrls = [];
      const uploadPromises = [];
      let fallbackUsed = false;

      // Parallelize image file uploads to Firebase Storage for ultra-fast creation
      if (imageFile) {
        const storageRef = ref(storage, `events/${eventRef.id}/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        uploadPromises.push(
          uploadTask.then(async (snapshot) => {
            imageUrl = await getDownloadURL(snapshot.ref);
          }).catch(async (err) => {
            console.warn("Cover image upload failed, compressing to base64:", err);
            try {
              imageUrl = await compressImageToBase64(imageFile);
            } catch (compressErr) {
              console.error("Compression failed:", compressErr);
              imageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80";
            }
            fallbackUsed = true;
          })
        );
      }

      if (galleryFiles && galleryFiles.length > 0) {
        galleryFiles.forEach((gFile, idx) => {
          const gRef = ref(storage, `events/${eventRef.id}/gallery_${idx}_${gFile.name}`);
          const uploadTask = uploadBytesResumable(gRef, gFile);
          uploadPromises.push(
            uploadTask.then(async (snapshot) => {
              const url = await getDownloadURL(snapshot.ref);
              galleryUrls[idx] = url;
            }).catch(async (err) => {
              console.warn(`Gallery image ${idx} upload failed, compressing to base64:`, err);
              try {
                galleryUrls[idx] = await compressImageToBase64(gFile);
              } catch (compressErr) {
                console.error("Gallery compression failed:", compressErr);
              }
              fallbackUsed = true;
            })
          );
        });
      }

      if (uploadPromises.length > 0) {
        try {
          await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.warn("Some image uploads failed, continuing with placeholders:", uploadError);
          fallbackUsed = true;
        }
      }

      // If imageUrl is empty but the user provided an image that failed, use base64 or placeholder
      if (imageFile && !imageUrl) {
        try {
          imageUrl = await compressImageToBase64(imageFile);
        } catch (compressErr) {
          imageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80";
        }
        fallbackUsed = true;
      }

      const newEvent = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        category: eventData.category,
        price: Number(eventData.price) || 0,
        ticketTypes: eventData.ticketTypes || [{ type: 'General', price: Number(eventData.price) || 0 }],
        capacity: Number(eventData.capacity) || 0,
        imageUrl,
        galleryUrls: galleryUrls.filter(url => !!url),
        organizerId: currentUser.uid,
        status: eventData.status || 'pending', // draft, pending, approved, rejected
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(eventRef, newEvent);
      if (newEvent.status === 'approved') {
        setEvents(prev => [{ id: eventRef.id, ...newEvent }, ...prev]);
      }
      return { id: eventRef.id, fallbackUsed };
    } catch (error) {
      throw error;
    }
  };

  // Update an event
  const updateEvent = async (eventId, updatedData, imageFile) => {
    if (!currentUser) throw new Error("Must be logged in");

    try {
      const eventRef = doc(db, "events", eventId);
      let imageUrl = updatedData.imageUrl;

      if (imageFile) {
        try {
          const storageRef = ref(storage, `events/${eventId}/${imageFile.name}`);
          const uploadTask = await uploadBytesResumable(storageRef, imageFile);
          imageUrl = await getDownloadURL(uploadTask.ref);
        } catch (storageErr) {
          console.warn("Storage upload failed on edit, compressing to base64:", storageErr);
          imageUrl = await compressImageToBase64(imageFile);
        }
      }

      const updates = {
        ...updatedData,
        imageUrl,
        updatedAt: serverTimestamp()
      };

      await updateDoc(eventRef, updates);
      
      // Update local state if it's published
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, ...updates } : ev));
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Delete an event (Uses soft-delete to bypass production Firestore deletion blocks for non-admins)
  const deleteEvent = async (eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: 'deleted' });
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (error) {
      throw error;
    }
  };

  // Duplicate an event (Creates a draft copy)
  const duplicateEvent = async (eventId) => {
    try {
      const original = await getEventById(eventId);
      if (!original) throw new Error("Event not found");

      const { id, createdAt, updatedAt, likesCount, status, ...rest } = original;
      
      const newEvent = {
        ...rest,
        title: `${rest.title} (Copy)`,
        status: 'draft',
        likesCount: 0,
        organizerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const eventRef = doc(collection(db, "events"));
      await setDoc(eventRef, newEvent);
      return eventRef.id;
    } catch (error) {
      throw error;
    }
  };

  // Like an event
  const toggleLikeEvent = async (eventId, isLiked) => {
    if (!currentUser) throw new Error("Must be logged in");
    
    const eventRef = doc(db, "events", eventId);
    const userLikesRef = doc(db, "users", currentUser.uid, "interactions", "likes");

    try {
      await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw new Error("Event does not exist!");

        const newLikesCount = isLiked ? Math.max(0, eventDoc.data().likesCount - 1) : eventDoc.data().likesCount + 1;
        transaction.update(eventRef, { likesCount: newLikesCount });
        
        transaction.set(userLikesRef, {
          [eventId]: !isLiked
        }, { merge: true });
      });

      // Update local state smoothly
      setEvents(prev => prev.map(ev => 
        ev.id === eventId ? { ...ev, likesCount: isLiked ? Math.max(0, ev.likesCount - 1) : ev.likesCount + 1 } : ev
      ));
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Bookmark an event
  const toggleBookmarkEvent = async (eventId, isBookmarked) => {
    if (!currentUser) throw new Error("Must be logged in");
    const userBookmarksRef = doc(db, "users", currentUser.uid, "interactions", "bookmarks");
    try {
      await setDoc(userBookmarksRef, {
        [eventId]: !isBookmarked
      }, { merge: true });
      return true;
    } catch (error) {
      throw error;
    }
  };

  // ----- TICKETING SYSTEM -----

  const fetchMyTickets = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, "tickets"), where("userId", "==", currentUser.uid), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tickets.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return timeB - timeA;
      });
      setMyTickets(tickets);
    } catch (error) {
      console.error("Error fetching tickets: ", error);
    }
  };

  const registerForEvent = async (eventId) => {
    if (!currentUser) throw new Error("Must be logged in to register");
    
    // Check if already registered
    const existing = myTickets.find(t => t.eventId === eventId);
    if (existing) throw new Error("You are already registered for this event");

    try {
      const ticketRef = doc(collection(db, "tickets"));
      const newTicket = {
        eventId,
        userId: currentUser.uid,
        status: 'active',
        qrCodeData: `ticket:${ticketRef.id}:${eventId}:${currentUser.uid}`,
        createdAt: serverTimestamp()
      };
      await setDoc(ticketRef, newTicket);

      // Create Notification
      const notifRef = doc(collection(db, `users/${currentUser.uid}/notifications`));
      await setDoc(notifRef, {
        title: "Registration Successful!",
        message: `You have successfully secured a ticket for event ID: ${eventId}.`,
        type: "success",
        read: false,
        createdAt: serverTimestamp(),
        link: "/tickets"
      });
      
      // Update local state
      setMyTickets(prev => [{ id: ticketRef.id, ...newTicket, createdAt: new Date() }, ...prev]);
      return ticketRef.id;
    } catch (error) {
      throw error;
    }
  };

  const cancelTicket = async (ticketId) => {
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, { status: 'cancelled', updatedAt: serverTimestamp() });
      
      // Create Notification
      const notifRef = doc(collection(db, `users/${currentUser.uid}/notifications`));
      await setDoc(notifRef, {
        title: "Booking Cancelled",
        message: `Your booking for ticket ID: ${ticketId} has been cancelled.`,
        type: "info",
        read: false,
        createdAt: serverTimestamp()
      });

      setMyTickets(prev => prev.filter(t => t.id !== ticketId));
      return true;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    events,
    myTickets,
    loadingEvents,
    fetchEvents,
    fetchMyTickets,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    toggleLikeEvent,
    toggleBookmarkEvent,
    registerForEvent,
    cancelTicket,
    isSeeding
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};
