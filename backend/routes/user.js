const express = require('express');
const { followUser, updatePassword, updateProfile, deleteProfile, myProfile, getUserProfile } = require('../controllers/user');
const {isAuthenticated} = require('../middlewares/auth');

const router = express.Router();

router.route("/follow/:id").get(isAuthenticated, followUser);
router.route("/update/password").put(isAuthenticated, updatePassword);
router.route("/update/profile").put(isAuthenticated, updateProfile);
router.route("/delete/profile").delete(isAuthenticated, deleteProfile);
router.route("/profile").get(isAuthenticated, myProfile);
router.route("/user/:id").get(isAuthenticated, getUserProfile)

module.exports = router;