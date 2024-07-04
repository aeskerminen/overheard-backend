const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({ 
    content: String,
    channel: String,
    color: String,
    identifier: String
}, {timestamps: true});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post