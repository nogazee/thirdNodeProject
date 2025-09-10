const express = require('express');
const Member = require('../models/member');
const Team = require('../models/team');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/members', async (req, res) => {
    const details = req.body;
    if (details.team) {
        const team = await Team.findOne({ name: req.body.team });
        if (!team) {
            return res.status(400).send();
        }
        details.team = team._id;
    }
    const member = new Member(details);
    try {
        await member.save();
        const token = await member.generateAuthToken();
        res.status(201).send({ member, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/members/login', async (req, res) => {
    try {
        const member = await Member.findByCredentials(req.body.IDF_number, req.body.password);
        const token = await member.generateAuthToken();
        res.send({ member, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/members/logout', auth, async (req, res) => {
    try {
        req.member.tokens = req.member.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.member.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/members/logoutAll', auth, async (req, res) => {
    try {
        req.member.tokens = [];
        await req.member.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/members', auth, async (req, res) => {
    try {
        if (!req.member.team) {
            return res.status(400).send();
        }
        const team = await Team.findById(req.member.team);
        await team.populate('members');
        res.send(team.members);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/members/me', auth, async (req, res) => {
    res.send(req.member);
});

router.get('/members/:id', auth, async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).send();
        }
        res.send(member);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/members/getTeam/:id', auth, async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(400).send();
        }
        if (!member.team) {
            return res.send('This member is not on a team yet');
        }
        await member.populate('team');
        res.send(member.team);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/members/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'IDF_number', 'password', 'team'];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    const details = req.body;
    if (details.team) {
        const team = await Team.findOne({ name: req.body.team });
        if (!team) {
            return res.status(400).send();
        }
        details.team = team._id;
    }
    try {
        updates.forEach((update) => (req.member[update] = details[update]));
        await req.member.save();
        res.send(req.member);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/members/me', auth, async (req, res) => {
    try {
        await req.member.remove();
        res.send(req.member);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;