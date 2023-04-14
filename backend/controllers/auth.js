const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const handlebars = require('handlebars');
const router = express.Router();

const User = require('../models/User.model');

const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/imageUpload.middleware');

const sendEmail = require('../server-utils/sendEmail');
const readHTML = require('../server-utils/readHTML');

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

// @route : PUT /api/auth
router.put('/', auth, upload.single('profilePic'), async (req, res) => {
    try {
        const {name, username} = req.body;

        let user = await User.findOne({ username : username.toLowerCase() });
        if(user && user._id.toString() !== req.userId){
            return res.status(400).json({
                success : false,
                message : 'Username is already taken',
            });
        }

        const updatedUser = {};
        if(name) updatedUser.name = name;
        if(username) updatedUser.username = username;

        if(req.file && req.file.path){
            updatedUser.profilePicUrl = req.file.path;
        }

        user = await User.findByIdAndUpdate(req.userId, updatedUser, { new : true });

        res.status(200).json(user);
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
}); 

// @route : PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
    try{
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId).select('+password');
        if(!user){
            return res.status(404).json({
                success : false,
                message : 'User not found',
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch){
            return res.status(401).json({
                success : false,
                message : 'Incorrect Password',
            });
        }

        if(newPassword.length < 6){
            return res.status(400).json({
                success : false,
                message : 'Password must be atleast 6 characters long',
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success : true,
            message : 'Password Updated',
        });
    }
    catch (err){
        res.status(500).json({ message: 'Server error' });
    }
})

// @route:  POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email : req.body.email });
        if(!user){
            return res.status(404).json({
                success : false,
                message : 'User not found',
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 30*60*100;

        const resetUrl = `${req.protocol}://${req.get(
            'host'
        )}/reset-password/${resetToken}`;

        const htmlTemplate = await readHTML(
            path.join(__dirname, '..', 'emails', 'forgot-password.html')
        );

        const handlebarsTemplate = handlebars.compile(htmlTemplate);
        const replacements = { resetUrl };
        const html = handlebarsTemplate(replacements);

        try {
            await sendEmail({
                to : user.email,
                subject : 'DevDojo - Reset Password',
                html,
            });
        }
        catch (err){
            console.log(err);
            user.resetPasswordToken = undefined;
            await user.save();  
            return res.status(500).json({
                success : false,
                message : 'Error sending verification email',
            });
        }

        await user.save();
        res.status(200).json({
            success : true,
            message : 'Email sent',
        });
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success : true,
            message : 'Server error',
        });
    }
})

// @route:  PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', async (req, res) => {
    try{
        const resetPasswordToken = crypto
          .createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire : { $gt : Date.now()},
        });

        if(!user){
            return res.status(400).json({
                success : false,
                message : 'Invalid or Expired token',
            });
        }

        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.status(200).json({
            success : true,
            message : 'Password resetted succesfully',
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

module.exports = router;