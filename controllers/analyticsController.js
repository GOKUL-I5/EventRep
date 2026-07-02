const { db } = require('../config/firebaseAdmin');

const getAdminAnalytics = async (req, res, next) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, error: "Firebase DB not initialized" });
    }

    const usersSnap = await db.collection("users").get();
    const eventsSnap = await db.collection("events").get();
    const ticketsSnap = await db.collection("tickets").where("status", "==", "active").get();

    let estimatedRevenue = 0;
    const eventsData = {};
    eventsSnap.docs.forEach(doc => {
      eventsData[doc.id] = doc.data();
    });

    ticketsSnap.docs.forEach(doc => {
      const ticket = doc.data();
      const event = eventsData[ticket.eventId];
      if (event && event.price) {
        estimatedRevenue += Number(event.price);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersSnap.size,
        totalEvents: eventsSnap.size,
        totalTicketsSold: ticketsSnap.size,
        estimatedRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminAnalytics };
