const uuid = require('uuid').v4;
const express = require('express');
const router = express.Router();

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');

const auth = require('../middleware/auth.middleware');

// @route   GET /api/comments/:postId
// @desc    Get comments on a post  
router.get('/:postId', async (req, res) => {
    try {
        const post = await Comment.findOne({ post : req.params.postId })
            .populate('comments.user')
            .populate('comments.replies.user');

        if(!post){
            return res.status(404).json({
                success : false,
                message : 'Post not found',
            });
        }

        res.status(200).json(post.comments);
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

// @route   POST /api/comments/:postId
// @desc    Add a new comment to post
router.post('/:postId', auth, async (req, res) => {
    try{
        if(req.body.text.length < 1){
            return res.status(400).json({
                success : false,
                message : 'Comment must be atleast 1 character long',
            });
        }

        let post = await Comment.findOne({ post : req.params.postId });
        if(!post){
            return res.status(404).json({
                success : false,
                message : 'Post not found',
            });
        }

        const comment = {
            _id : uuid(),
            user : req.userId,
            text : req.body.text,
            date : Date.now(),
            likes : [],
            replies : [],
        };

        post.comments.unshift(comment);
        post = await post.save();

        post = await Comment.populate(post, 'comments.user');
        post = await Comment.populate(post, 'comments.replies.user');

        res.status(201).json(post.comments); 
    }
    catch (error){
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'Server error',
        });
    }
});

