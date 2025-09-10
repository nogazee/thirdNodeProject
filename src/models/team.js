const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }
});

teamSchema.virtual('members', {
    ref: 'Member',
    localField: '_id',
    foreignField: 'team'
});

teamSchema.pre('remove', async function (next) {
    const team = this;
    await team.populate('members');
    team.members.forEach(async (member) => {
        member.set('team', undefined);
        await member.save();
    });
    next();
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;