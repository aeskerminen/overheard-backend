const PostSchema = new mongoose.Schema({ 
    content: String,
    identifier: String
}, {timestamps: true});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post