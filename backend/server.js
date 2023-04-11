require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const app = require('./app.js');

mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log('Listening to port');
    })  
  })
  .catch((error) => {
    console.log(error)
  })