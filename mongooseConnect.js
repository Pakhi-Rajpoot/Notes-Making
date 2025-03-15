const mongoose = require("mongoose");
require('dotenv').config();

const mongoURI = process.env.mongoURI;
mongoose.connect(mongoURI)
.then(function(req, res){
    console.log("mongoDB atlas connected");
})
.catch(function(err){
    console.log(err);
})