const mongoose = require('mongoose')

const passportLocalMongoose = require('passport-local-mongoose')

const UserModel = new mongoose.Schema({
    username: String,
    password: String
})

UserModel.plugin(passportLocalMongoose.default);

module.exports = mongoose.model('User', UserModel)
