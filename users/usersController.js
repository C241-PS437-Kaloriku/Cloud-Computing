const db = require('../server/dbFirebase');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { generateToken } = require('./authMiddleware');
const bucket  = require('../server/storage');

const moment = require('moment');

const generateUserId = () => {
  return uuidv4();
};

const register = async (req, res) => {
  const { email, password, birthdate } = req.body;

  const emailRegex = /\S+@\S+\.\S+/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).send({ message: 'Tolong masukkan email yang valid.' });
  }

  if (!password || !birthdate) {
    return res.status(400).send({ message: 'Tolong masukan data dengan lengkap.' });
  }

  if (!moment(birthdate, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).send({ message: 'Tolong masukkan tanggal lahir yang valid (format: YYYY-MM-DD).' });
  }

  // Hitung umur
  const birthDateMoment = moment(birthdate, 'YYYY-MM-DD');
  const age = moment().diff(birthDateMoment, 'years');

  try {
    const emailQuery = db.collection('users').where('email', '==', email);
    const emailSnapshot = await emailQuery.get();

    if (!emailSnapshot.empty) {
      return res.status(400).send({ message: 'Email yang anda daftarkan sudah digunakan, coba gunakan email lain.' });
    }

    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = moment().toISOString(); 

    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      userId,
      email,
      password: hashedPassword,
      birthdate,
      age,
      createdAt 
    });

    res.status(201).send({ message: 'Akun berhasil didaftarkan', userId });
  } catch (error) {
    // console.error('Error registering user:', error); // Log the error
    res.status(500).send({ message: 'Akun gagal didaftarkan.', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Tolong masukan email dan password dengan benar.' });
  }

  try {
    const userQuery = db.collection('users').where('email', '==', email);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return res.status(400).send({ message: 'Email yang anda masukan tidak terdaftar pada sistem kami.' });
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userData.userId;

    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(400).send({ message: 'Password salah, harap coba lagi.' });
    }

    const token = generateToken(userId);

    const expirationTime = moment().add(24, 'hours').toISOString();
    await db.collection('users').doc(userId).collection('sessions').doc(token).set({
      token,
      issuedAt: moment().toISOString(),
      expirationTime
    });

    res.status(200).send({
      message: 'Login berhasil.',
      user: {
        userId: userData.userId,
        email: userData.email,
        photoprofile: userData.profilePictureUrl,
        username: userData.username,
        birthdate: userData.birthdate,
        age: userData.age,
        gender: userData.gender,
        weight: userData.weight,
        height: userData.height
      },
      token
    });
  } catch (error) {
    // console.error('Error during login:', error); // Log the error
    res.status(500).send({ message: 'Terjadi masalah saat login.', error });
  }
};

const uploadPicture = async (req, res) => {
  try {
    const { userId } = req.body;
    const profilePicture = req.file;

    if (!userId || !profilePicture) {
      return res.status(400).send({ message: 'User ID atau file gambar tidak ditemukan dalam permintaan.' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(profilePicture.mimetype)) {
      return res.status(400).send({ message: 'Hanya file gambar dengan ekstensi JPEG atau PNG yang diizinkan.' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(400).send({ message: 'User ID yang anda masukan tidak terdaftar pada sistem kami.' });
    }

    const { originalname, buffer, mimetype } = profilePicture;
    const fileName = `${userId}-${Date.now()}-${originalname}`;
    console.log(fileName);

    const blob = bucket.file(`profilePicture/${fileName}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: mimetype,
      metadata: {
        contentType: mimetype
      },
    });

    blobStream.on('error', (err) => {
      console.error('Terjadi masalah saat mengunggah foto profil:', err);
      res.status(500).send({ message: 'Terjadi masalah saat mengunggah foto profil.' });
    });

    blobStream.on('finish', async () => {
      const profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      await userRef.update({ profilePictureUrl });
      res.status(200).send({ message: 'Profil berhasil diperbarui.', profilePictureUrl });
    });

    blobStream.end(buffer);
  } catch (error) {
    console.error('Terjadi kesalahan pada server:', error);
    res.status(500).send({ message: 'Terjadi kesalahan pada server.' });
  }
};

const editProfile = async (req, res) => {
  const { userId, weight, height, gender, birthdate, username } = req.body;

  if (!userId || (!weight && !height && !gender && !birthdate && !username)) {
    return res.status(400).send({ message: 'Tolong masukan userId dan setidaknya satu data untuk diperbarui (berat, tinggi, jenis kelamin, tanggal lahir, atau username).' });
  }

  try {
    const userRef = db.collection('users').where('userId', '==', userId);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      return res.status(400).send({ message: 'User ID yang anda masukan tidak terdaftar pada sistem kami.' });
    }

    const updates = {};

    if (weight) updates.weight = weight;
    if (height) updates.height = height;
    if (gender) updates.gender = gender;
    if (birthdate) {
      const birthdateObj = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthdateObj.getFullYear();
      const monthDiff = today.getMonth() - birthdateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
        age--;
      }
      updates.age = age;
      updates.birthdate = birthdate; 
    }

    if (username) {
      const usernameRef = db.collection('users').where('username', '==', username);
      const usernameSnapshot = await usernameRef.get();

      if (!usernameSnapshot.empty) {
        return res.status(400).send({ message: 'Username yang anda masukan sudah digunakan, coba gunakan username lain.' });
      }

      updates.username = username;
    }

    await db.runTransaction(async (t) => {
      snapshot.forEach(doc => {
        t.update(doc.ref, updates);
      });
    });

    res.status(200).send({ message: 'Data berhasil diperbarui.' });
  } catch (error) {
    res.status(500).send({ message: 'Terjadi masalah saat memperbarui data.', error });
  }
};

const logout = async (req, res) => {
  const { userId } = req.body;

  try {
    // Validasi userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).send({ message: 'Invalid User ID.' });
    }

    // Ambil referensi ke subkoleksi 'sessions' berdasarkan userId
    const sessionsRef = db.collection('users').doc(userId).collection('sessions');
    const snapshot = await sessionsRef.get();

    if (snapshot.empty) {
      return res.status(400).send({ message: 'No sessions found for this user.' });
    }

    // Hapus semua dokumen dalam subkoleksi 'sessions'
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.status(200).send({ message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).send({ message: 'Terjadi masalah saat logout.' });
  }
};

const getProfile = async (req, res) => {
  const { userId } = req.query;  
  console.log('Received userId:', userId); 

  if (!userId) {
    return res.status(400).send({ message: 'Tolong masukkan userId.' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    // console.log('User document exists:', userDoc.exists); // Log user document existence

    if (!userDoc.exists) {
      return res.status(404).send({ message: 'User ID tidak ditemukan dalam sistem kami.' });
    }

    const userData = userDoc.data();
    res.status(200).send({
      message: 'Profil berhasil didapatkan.',
      user: {
        userId: userData.userId,
        email: userData.email,
        photoprofile: userData.profilePictureUrl,
        username: userData.username,
        birthdate: userData.birthdate,
        age: userData.age,
        gender: userData.gender,
        weight: userData.weight,
        height: userData.height
      }
    });

  } catch (error) {
    // console.error('Error getting profile:', error); // Log the error
    res.status(500).send({ message: 'Terjadi masalah saat mendapatkan profil.', error });
  }
};


module.exports = {
  register,
  login,
  logout,
  generateToken,
  editProfile,
  uploadPicture,
  getProfile,
};

