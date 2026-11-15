const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const STATUSES = ['Pending', 'Completed', 'Deleted','Overdue'];

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
        default: 'Pending'
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TodoUser',
        required: true
    },
    end_at: {
        type: Date,
        default: null
    }
}, {timestamps:true});


module.exports = mongoose.model('Tasks', TaskSchema)

