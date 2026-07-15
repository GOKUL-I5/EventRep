const { db, admin } = require('../config/firebaseAdmin');

const getAllEvents = async (req, res, next) => {
  try {
    if (!db) return res.status(503).json({ success: false, error: "Firebase DB not initialized" });

    // Fetch approved events by default, unless admin
    let eventsSnap;
    if (req.user && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      eventsSnap = await db.collection("events").orderBy("createdAt", "desc").get();
    } else {
      eventsSnap = await db.collection("events")
        .where("status", "==", "approved")
        .orderBy("createdAt", "desc").get();
    }

    const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    if (!db) return res.status(503).json({ success: false, error: "Firebase DB not initialized" });

    const { id } = req.params;
    await db.collection("events").doc(id).delete();

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllEvents, deleteEvent };
