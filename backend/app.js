const express = require('express');
const cors = require('cors');
const post = require("./routes/post.js"); 
const auth = require("./routes/auth.js");
const user = require("./routes/user.js");
const cookieParser = require("cookie-parser");

const app = express()

// middlewares
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

app.use(cors({
  origin : "*",
  methods : ["GET", "POST", "PUT", "PATCH"]
}));

// routes
app.use('/api/v1', post);
app.use('/api/v1', auth);
app.use('/api/v1', user);

module.exports = app;