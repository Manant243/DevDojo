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

