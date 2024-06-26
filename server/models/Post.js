const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PostSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel', 
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true        
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema)