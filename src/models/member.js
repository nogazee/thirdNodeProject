const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Team = require('./team');

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    IDF_number: {
        type: Number,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (value.toString().length !== 7) {
                throw new Error("Invalid IDF Number");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
});

memberSchema.methods.toJSON = function () {
    const member = this;
    const memberObject = member.toObject();
    delete memberObject.password;
    delete memberObject.tokens;
    return memberObject;
};

memberSchema.methods.generateAuthToken = async function () {
    const member = this;
    const token = jwt.sign({ _id: member._id.toString() }, process.env.JWT_SECRET);

    member.tokens = member.tokens.concat({ token });
    await member.save();

    return token;
}

memberSchema.statics.findByCredentials = async (IDF_number, password) => {
    const member = await Member.findOne({ IDF_number });
    if (!member) {
        throw new Error("Unable to login");
    }
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
        throw new Error("Unable to login");
    }
    return member;
};

memberSchema.pre('save', async function (next) {
    const member = this;
    if (member.isModified('password')) {
        member.password = await bcrypt.hash(member.password, 8);
    }
    next();
});

memberSchema.pre('remove', async function (next) {
    const member = this;
    if (member.team) {
        const team = await Team.findById(member.team);
        if (team.leader.equals(member._id)) {
            team.set('leader', undefined);
            await team.save();
        }
    }
    next();
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;