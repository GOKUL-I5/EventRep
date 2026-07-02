const { db, admin } = require('../config/firebaseAdmin');

const getUserProfile = async (req, res, next) => {
  try {
    if (!db) return res.status(503).json({ success: false, error: "Firebase DB not initialized" });

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, data: userDoc.data() });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    if (!db) return res.status(503).json({ success: false, error: "Firebase DB not initialized" });

    const updates = req.body;
    // Prevent changing role via this endpoint
    delete updates.role;
    
    await db.collection("users").doc(req.user.uid).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile };
