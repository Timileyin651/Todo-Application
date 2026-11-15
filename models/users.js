const mongoose = require('mongoose')

const passportLocalMongoose = require('passport-local-mongoose')

const UserModel = new mongoose.Schema({
    username: String,
    password: String,
    email: {
        type:String,
        required:true,
        unique:true
    }
})

// UserModel.plugin(passportLocalMongoose.default);
UserModel.plugin(passportLocalMongoose.default)

module.exports = mongoose.model('TodoUser', UserModel)
