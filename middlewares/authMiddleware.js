const { admin } = require('../config/firebaseAdmin');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No valid Bearer token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ error: 'Unauthorized', message: 'Token verification failed' });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const { db } = require('../config/firebaseAdmin');
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (userDoc.exists && userDoc.data().role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden', message: 'Requires admin privileges' });
    }
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return res.status(500).json({ error: 'Server Error', message: 'Could not verify admin status' });
  }
};

module.exports = { verifyToken, verifyAdmin };
