const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({ 
    votes: Number,
    voters: {
        type: Map,
        of: String
    },
    post_identifier: String,
}, {timestamps: true});

const Vote = mongoose.model('Vote', VoteSchema);

module.exports = Vote