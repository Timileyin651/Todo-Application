const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const STATUSES = ['Pending', 'Completed', 'Deleted'];

const TaskSchema = new Schema ({
    title:{
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    status:{
        type: String,
        enum: STATUSES,
        default: 'pending'
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps:true});


module.exports = mongoose.model('Tasks', TaskSchema)

