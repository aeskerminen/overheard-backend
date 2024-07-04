const UserSchema = new mongoose.Schema({ 
    email: String,
    password: String,
    id: String
}, {timestamps: true});

const User = mongoose.model('User', UserSchema);v

module.exports = User