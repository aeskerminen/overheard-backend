const PostSchema = new mongoose.Schema({ 
    content: String,
    identifier: String
}, {timestamps: true});

const Post = mongoose.model('Post', PostSchema);v

module.exports = Post