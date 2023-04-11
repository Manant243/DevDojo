const express = require('express');
const { createPost, likeAndUnlikePost, deletePost, updatePost, addComment, deleteComment } = require('../controllers/post');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.route('/post/upload').post(isAuthenticated, createPost);

router.route("/post/:id").get(isAuthenticated, likeAndUnlikePost);

router.route("/post/:id").put(isAuthenticated, updatePost);

router.route("/post/:id").delete(isAuthenticated, deletePost);

router.route("/post/comment/:id").put(isAuthenticated, addComment).delete(isAuthenticated, deleteComment);

module.exports = router;