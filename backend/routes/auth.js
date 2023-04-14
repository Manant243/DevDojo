const express = require('express');
const { register, login, logout, forgotPassword } = require('../controllers/auth');
const {isAuthenticated} = requir("../middlewares/auth.js");

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgot/password').post(isAuthenticated, forgotPassword)

module.exports = router;