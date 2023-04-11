const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({

    name : {
        type : String,
        required : [true, "Please enter a name"]
    },

    email : {
        type : String,
        required : [true, "Please enter an email"],
        unique : [true, "Email already exists"]
    },

    password : {
        type : String,
        required : [true, "Please enter a password"],
        minlength : [6, "Password must be atleast 6 characters"],
        select : false
    },

    avatar : {
        public_id : String,
        url : String
    },

    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Post"
        }
    ],

    followers : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
        }
    ],

    following : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
        }
    ]

});

userSchema.pre("save", async function (next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
});

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
    return jwt.sign({_id : this._id}, process.env.JWT_SECRET);
};

userSchema.methods.getResetPasswordToken = function () {
    
}

module.exports = mongoose.model('User', userSchema);