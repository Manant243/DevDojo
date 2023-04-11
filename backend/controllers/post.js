const Post = require("../models/Post");
const User = require("../models/User");

exports.createPost = async (req, res) => {

    try{
        const newPostData = {
            caption : req.body.caption,

            image : {
                public_id : "req.body.public_id",
                url : "req.body.url"
            },

            owner : req.user._id
        }
        
        const newPost = await Post.create(newPostData);
        
        const user = await User.findById(req.user._id);

        user.posts.push(newPost._id);

        await user.save();

        res.status(201).json({
            success : true,
            post : newPost  
        });

    }
    catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
    
};

exports.deletePost = async (req, res) => {

    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }


        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success : false,
                error : "Unauthorized access"
            });
        }

        await Post.findOneAndRemove({_id : post});

        const user = await User.findById(req.user._id);
        const index = await user.posts.indexOf(req.params.id);

        user.posts.splice(index, 1);
        await user.save();

        return res.status(200).json({
            success : true,
            message : "Post Deleted"
        });

    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }

}

exports.updatePost = async (req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success : false,
                message : "Unauthorized"
            });
        }

        post.caption = req.body.caption;
        await post.save();

        return res.status(200).json({
            success : true,
            message : "Post Updated"
        });

    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

exports.likeAndUnlikePost = async (req, res) => {
    
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }

        let exists = post.likes.includes(req.user._id);

        if(exists){

            const index = post.likes.indexOf(req.user._id); 
            post.likes.splice(index, 1);

            await post.save();

            return res.status(200).json({
                success : true,
                message : "Post Unliked"
            });
        }
        else{

            post.likes.push(req.user._id);
            await post.save();

            return res.status(200).json({
                success : true,
                message : "Post liked"
            });
        }

    }
    catch (error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

exports.addComment = async(req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }

        post.comments.push({
            user : req.user._id,
            comment : req.body.comment
        });

        await post.save();

        return res.status(200).json({
            success : true,
            message : "Comment Added"
        });

    }
    catch (error){
        return res.status(500).json({
            success : false,
            error : error.message
        });
    }
}

exports.deleteComment = async(req, res) => {
    try{

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }

        if(post.owner.toString() === req.user._id.toString()){

            if(req.body.commentId == undefined){
                return res.status(400).json({
                    success : false,
                    message : "Comment Id is required"
                });
            }

            post.comments.forEach((item, index) => {
                if(item._id.toString() === req.body.commentId.toString()){
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();

            return res.status(200).json({
                success : true,
                message : "Comment Deleted"
            });

        }
        else{
            post.comments.forEach((item, index) => {
                if(item.user.toString() === req.user._id.toString()){
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();

            res.status(200).json({
                success : true,
                message : "Comment Deleted"
            });
        }

    }
    catch (error){
        return res.status(200).json({
            success : true,
            message : "Post Added"
        });
    }
}