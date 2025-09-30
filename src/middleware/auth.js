const jwt = require('jsonwebtoken');
const Member = require('../models/member');
const { StatusCodes } = require('http-status-codes');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const member = await Member.findOne({ _id: decoded._id, 'tokens.token': token });
        if (!member) {
            throw new Error();
        }
        req.token = token;
        req.member = member;
        next();
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).send({ error: 'Please authenticate.' });
    }
};

const editPermission = (req, res, next) => {
    try {
        if (!req.member.isLeader) {
            res.status(StatusCodes.UNAUTHORIZED).send();
        }
        next();
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).send();
    }
}

module.exports = {
    auth, 
    editPermission
};