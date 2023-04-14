const express = require('express');
const router = express.Router();

const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Follower = require('../models/Follower.model');
const Post = require('../models/Post.model');

const auth = require('../middleware/auth.middleware');

// @route   GET /api/profile/:username
router.get('/:username', async (req, res) => {
    try{
        const user = await User.findOne({
            username : req.params.username.toLowerCase(),
        });

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'User not found',
            });
        }

        const profile = await Profile.findOne({ user : user._id }).populate('user');
        const follow = await Follower.findOne({ user : user._id});

        const posts = await Post.find({ user : user._id})
            .sort({ createdAt : -1})
            .populate('user');

        res.status(200).json({
            success : true,
            profile, 
            followers : follow.followers,
            following : follow.following,
            posts,
        });
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : 'false',
            message : 'Server error',
        });
    }
});

// @route GET /api/profile/:username/followers
router.get('/:username/followers', async (req, res) => {
    try {
        const user = await User.findOne({
            username :  req.params.username.toLowerCase(),
        });

        if(!user){
            return res.status({
                success : false,
                message : 'User not found',
            });
        }

        const followers = await Follower.findOne({ user: user._id }).populate(
            'followers.user'
        );

        res.status(200).json(followers.followers);
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   GET /api/profile/:username/following
router.get('/:username/following', async (req, res) => {
    try {
        const user = await User.findOne({
            username :  req.params.username.toLowerCase(),
        });

        if(!user){
            return res.status({
                success : false,
                message : 'User not found',
            });
        }

        const following = await Follower.findOne({ user: user._id }).populate(
            'following.user'
        );

        res.status(200).json(following.following);
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   GET /api/profile
router.get('/', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user : req.userId });

        if(!profile){
            return res.status(404).json({
                success : false,
                message : 'User not found',
            });
        }

        res.status(200).json(profile);
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   PUT /api/profile
router.put('/', auth, async (req, res) => {
    try {
        const { bio, techStack, social } = req.body;
        
        let profile = await Profile.findOne({ user: req.userId });
        if(!profile) {
            return res.status(404).json({
                success : false,
                message : 'Profile not found',
            });
        }

        profile = await Profile.findOneAndUpdate(
            { user: req.userId },
            { bio, techStack, social },
            { new: true }
        );

        res.status(200).json(profile);
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   POST /api/profile/follow/:userId
router.post('/follow/:userId', auth, async (req, res) => {
    try {
        const loggedInUser = await Follower.findOne({ user : req.userId });
        const userToFollowOrUnfollow = await Follower.findOne({
            user : req.params.userId,
        });

        if(!loggedInUser || !userToFollowOrUnfollow) {
            return res.status(404).json({
                success : true,
                message : 'User not found',
            });
        }

        const isFollowing = loggedInUser.following.length > 0 &&
            loggedInUser.following.filter(
                (following) => following.user.toString() == req.params.userId
            ).length > 0;

        if(isFollowing){
            let index = loggedInUser.following.findIndex(
                (following) => following.user.toString() == req.params.userId
            );

            loggedInUser.following.splice(index, 1);
            await loggedInUser.save();

            index = userToFollowOrUnfollow.followers.findIndex(
                (follower) => follower.user.toString() == req.userId
            );

            userToFollowOrUnfollow.followers.splice(index, 1);
            await userToFollowOrUnfollow.save();

            res.status(200).json(
                userToFollowOrUnfollow.followers
            );
        }
        else{
            loggedInUser.following.unshift({ user : req.params.userId });   
            await loggedInUser.save();

            userToFollowOrUnfollow.followers.unshift({ user : req.userId });
            await userToFollowOrUnfollow.save();

            res.status(200).json(userToFollowOrUnfollow.followers);
        }
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

module.exports = router;
