const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const handlebars = require('handlebars');
const router = express.Router();

const User = require('../models/User.model');

const auth = require('../middleware/auth.middleware');

// @route: GET /api/auth
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(400).json({
                success : false,
                message : 'Please verify your email and complete your onboarding first',
            });
        }

        res.status(200).json({
            success : true,
            user,
        });
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route : POST /api/auth
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if(password.length < 6){
        return res.status(400).json({
            success : false,
            message : 'Password must be atleast 6 characters long',
        });
    }

    try {
        const user = await User.findOne({ email : email.toLowerCase() }).select('+password');

        if(!user){
            return res.status(400).json({
                success : false,
                message : 'Invalid Credentials',
            });
        }

        if(!user.isVerified) {
            return res.status(400).json({
                success : false,
                message : 'Please verify your email before trying to log in',
            });
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if(!isCorrectPassword){
            return res.status(400).json({
                success : 'false',
                message : 'Invalid Credentials',  
            });
        }

        jwt.sign({ userId : user._id}, process.env.JWT_SECRET, (err, token) => {
            if(err) throw err;
            res.status(200).json({ token });
        });
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success : 'false',
            message : 'Server error'
        });
    }
})