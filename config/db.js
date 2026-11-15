const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger')
const { startOverdueJob } = require('../jobs/overdueJob')

const MONGODB_URI = process.env.MONGODB_URI;

//connect to mongodb
function connectToMongoDB(){
    mongoose.connect(MONGODB_URI);

    mongoose.connection.on('connected', () =>{
        logger.info('Connected to MongoDB successfully')
    });

    mongoose.connection.once('connected', startOverdueJob);

    mongoose.connection.on('error', (error)=>{
        logger.error('Error connecting to MongoDB', error);
    })

}

module.exports = { connectToMongoDB };