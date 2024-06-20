const express = require('express');
const router = express.Router();
const usersController = require('../users/usersController');
const recommendedFoodsController = require('../service/recommendedFoodsController');
const service = require('../service/bmiCalculator');
const { checkSession } = require('../users/authMiddleware');
const { upload } = require('../users/uploadPPicture');

// Register
router.post('/register', usersController.register);

// Login
router.post('/login', usersController.login);

// Edit Profile
router.put('/profile', checkSession, upload, usersController.editProfile);

// Add Photo Profile
router.post('/photoprofile', checkSession, upload, usersController.uploadPicture);

// Get Profile
router.get('/profile', checkSession, usersController.getProfile);

// Mendapatkan Nilai BMI
router.get('/bmical', checkSession, service.calculatorbmi);

// Logout akun
router.delete('/logout', usersController.logout);

// Save Recommended Foods
router.post('/save-recommended-foods', checkSession, recommendedFoodsController.saveRecommendedFoods);

// Get Recommended Foods
router.get('/get-recommended-foods', checkSession, recommendedFoodsController.getRecommendedFoods);


module.exports = router;
