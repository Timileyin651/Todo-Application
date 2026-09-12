const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger')

const MONGODB_URI = process.env.MONGODB_URI;

//connect to mongodb
function connectToMongoDB(){
    mongoose.connect(MONGODB_URI);

    mongoose.connection.on('connected', () =>{
        logger.error('Connected to MongoDB successfully')
    });

    mongoose.connection.on('error', (error)=>{
        logger.error('Error connecting to MongoDB', error);
    })
}

module.exports = { connectToMongoDB };