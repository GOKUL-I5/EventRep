const { db } = require('../config/firebaseAdmin');

const sendNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, link } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (!db) {
      return res.status(503).json({ success: false, error: "Firebase DB not initialized" });
    }

    const notifRef = db.collection(`users/${userId}/notifications`).doc();
    await notifRef.set({
      title,
      message,
      type: type || 'info',
      read: false,
      createdAt: new Date(), // admin uses standard Date or FieldValue.serverTimestamp()
      link: link || null
    });

    res.status(201).json({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendNotification };
