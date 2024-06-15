const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};
const db = admin.firestore();

const checkSession = async (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['Authorization'];

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if (err) return res.status(403).send('Sesi sudah berakhir');
    const userId = decodedToken.userId;
    if (!userId) return res.status(403).send('Invalid userId');

    try {
      const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(token);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        return res.status(401).send('Token Sesi sudah berakhir');
      }

      next();
    } catch (error) {
      console.error('Error checking session:', error);
      res.status(500).send('Internal server error');
    }
  });
};

module.exports = { generateToken, checkSession };
