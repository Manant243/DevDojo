const Post = require("../models/Post");
const User = require("../models/User");

exports.myProfile = async(req, res) => {
    try{
        const user = await User.findById(req.user._id).populate("posts");

        res.status(200).json({
            success : true, user
        });

    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

exports.getUserProfile = async(req, res) => {
    try{
        const user = await User.findById(req.params.id).populate("posts");

        if(!user){
            res.status(404).json({
                success : false,
                message : "User not found"
            });
        }

        return res.status(200).json({
            success : true, user
        })
    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

exports.followUser = async (req, res) => {
    try {

        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);

        if(!userToFollow){
            return res.status(404).json({
                success : false,
                message : "User not found"
            })
        }

        if(loggedInUser.following.includes(userToFollow._id)){
            
            const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
            loggedInUser.following.splice(indexfollowing, 1);

            const indexfollower = userToFollow.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexfollower, 1);

            await loggedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success : true,
                message : "User Unfollowed"
            });

        }
        else{

            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);
            
            await loggedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success : true,
                message : "User followed"
            });

        }

    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

exports.updatePassword = async (req, res) => {

    try{
        const user = await User.findById(req.user._id).select("+password");
        
        const { oldPassword, newPassword} = req.body;
        
        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success : false,
                message : "Please provide old and new passwords"
            });
        }

        const isMatch = await user.matchPassword(oldPassword);

        if(!isMatch){
            return res.status(400).json({
                success : false,
                message : "Incorrect Password"
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success : true,
            message : "Password Updated"
        })

    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "User not found"
        });
    }

}

exports.updateProfile = async (req, res) => {

    try{

        const user = await User.findById(req.user._id);
        const {name, email} = req.body;

        if(name){
            user.name = name;
        }

        if(email){
            user.email = email;
        }

        await user.save();

        res.status(200).json({
            success : true,
            message : "Profile Updated"
        });

    }
    catch (error){
        return res.status(500).json({
            success : true,
            message : error.message
        });
    }
}

exports.deleteProfile = async (req, res) => {
    try{

        const user = await User.findById(req.user._id);
        const posts = user.posts;
        const userId = user._id;
        const followers = user.followers;
        const following = user.following;

        await User.findOneAndDelete(user);

        res.cookie("token", null, {
            expires : new Date(Date.now()),
            httpOnly : true
        });

        for(let i = 0; i < posts.length; i++){
            const post = await Post.findById(posts[i]);
            await post.remove();
        }

        for(let i = 0; i < followers.length; i++){
            const follower = await User.findById(followers[i]);
            const index = follower.following.indexOf(userId);

            follower.following.splice(index, 1);
            await follower.save();
        }

        for(let i = 0; i < following.length; i++){
            const follows = await User.findById(following[i]);
            const index = follows.followers.indexOf(userId);

            follows.followers.splice(index, 1);
            await follows.save();
        }

        res.status(200).json({
            success : true,
            message : "Profile Deleted"
        });

    }
    catch (error){
        return res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

