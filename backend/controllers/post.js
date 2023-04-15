const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Post = require('../models/Post.model');
const User = require('../models/User.model');
const Follower = require('../models/Follower.model');
const Comment = require('../models/Comment.model');

const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/imageUpload.middleware');

// @route   POST /api/posts
// create a new post 
router.post('/', auth, upload.array('images', 5), async (req, res) => {
    const { title, description, liveDemo, sourceCode, techStack } = req.body;

    if(req.files.length < 1){
        return res.status(400).json({
            success : false,
            message : 'Atleast one image is required',
        });
    }

    try {
        const postObj = {
            user : req.userId,
            title,
            description,
            images : req.files.map((file) => file.path),
            liveDemo,
            techStack : JSON.parse(techStack),
        };

        if (sourceCode) postObj.sourceCode = sourceCode;

        const post = await new Post(postObj).save();
        await new Comment({ post : post._id, comments : [] }).save();

        res.status(201).json(post);
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   GET /api/posts
// @desc    Get all posts
router.get('/', async (req, res) => {
    try{
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Post.countDocuments();

        const posts = await Post.find()
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt : -1 })
            .populate('user');

        let next = null;
        if(endIndex < total){
            next = page+1;
        }

        res.status(200).json({ posts, next });
    }
    catch (error){
        console.error(err);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   GET /api/posts/feed
// @desc    Get posts of following users
router.get('/feed', auth, async (req, res) => {
    try{
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const user = await Follower.findOne({ user : req.userId }).select('-followers');
        const followingUsers = user.following.map((following) => following.user);

        const total = await Post.countDocuments({ user : { $in : followingUsers } });

        const posts = await Post.find({ user : { $in : followingUsers } })
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt : -1 })
            .populate('user')

        let next = null;
        if(endIndex < total){
            next = page+1;
        }

        res.status(200).json({ posts, next });
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

