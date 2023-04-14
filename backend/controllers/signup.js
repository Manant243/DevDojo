const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const handlebars = require('handlebars');

const router = express.Router();

const User = require('../models/User.model');

const sendEmail = require('../server-utils/sendEmail');
const readHTML = require('../server-utils/readHTML');

const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;

// @route : GET /api/signup
router.get('/:username', async (req, res) => {
    const {username} = req.params;

    try {
        if(username.length < 1){
            return res.status(400).json({
                Success : false,
                message : 'Invalid Username',
            });
        }

        if(!usernameRegex.test(username)){
            return res.status(400).json({
                Success : false,
                message : 'Invalid Username',
            });
        }

        const user = await User.findOne({ username : username.toLowerCase() });

        if(user) {
            return res.status(400).json({
                success : false,
                message : 'Username is already taken',
            });
        }

        res.status(200).json({
            success : true,
            message : 'Username available',
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

// @route : POST /api/signup

router.post('/', async (req, res) => {
    const { name, username, email, password} = req.body();

    if(password.length < 6){
        return res.status(400).json({
            success : false,
            message : 'Password must be atleast 6 characters long',
        });
    }

    try {
        let user = await User.findOne({ username : username.toLowerCase() });

        if(user){
            return res.status(400).json({
                success : false,
                message : 'User already exists',
            });
        }

        user = new User({
            name,
            email : email.toLowerCase(),
            username : username.toLowerCase(),
            password,
        });

        // Hashing the password
        user.password = await bcrypt.hash(password, 10);

        // Send verification email
        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');


        const verificationUrl = `${req.protocol}://${req.get(
        'host'
        )}/onboarding/${verificationToken}`;

        const htmlTemplate = await readHTML(
            path.join(__dirname, '..', 'emails', 'verify-email.html')
        );

        const handlebarsTemplate = handlebars.compile(htmlTemplate);
        const replacements = { verificationUrl };
        const html = handlebarsTemplate(replacements);

        try {
            await sendEmail({
                to : user.email,
                subject : 'DevDojo - Account Verification',
                html,
            });
        }
        catch (err){
            console.log(err);
            user.verificationToken = undefined;
            await user.save();
            return res.status(500).json({
                message : 'Error sending verification email',
            });
        }

        await user.save();

        jwt.sign({userId : user._id}, process.env.JWT_SECRET, (err, token) => {
            if(err) throw err;
            res.status(200).json({
                success : true,
                message : 'Please check your email to verify your registration',
                token,
            });
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

module.exports(router);