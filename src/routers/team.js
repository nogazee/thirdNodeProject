const express = require('express');
const Team = require('../models/team');
const Member = require('../models/member');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/teams', auth, async (req, res) => {
    const details = req.body;
    if (req.body.leader) {
        const leader = await Member.findOne({ IDF_number: req.body.leader });
        if (!leader) {
            return res.status(400).send();
        }
        details.leader = leader._id;
    }
    const team = new Team(details);
    try {
        await team.save();
        res.status(201).send(team);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/teams', auth, async (req, res) => {
    try {
        const teams = await Team.find({});
        if (!teams) {
            return res.status(404).send();
        }
        res.send(teams);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/teams/:id', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).send();
        }
        res.send(team);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/teams/getLeader/:id', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(400).send();
        }
        if (!team.leader) {
            return res.send('There is no leader for this team.');
        }
        await team.populate('leader');
        res.send(team.leader);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/teams/membersCount/:id', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(400).send();
        }
        const count = await Member.countDocuments({ team: req.params.id });
        res.send({ count });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/teams/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'leader'];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" });
    }
    const details = req.body;
    if (req.body.leader) {
        const leader = await Member.findOne({ IDF_number: req.body.leader });
        if (!leader) {
            return res.status(400).send();
        }
        details.leader = leader._id;
    }
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
          return res.status(404).send();
        }
        updates.forEach((update) => (team[update] = details[update]));
        await team.save();
        res.send(team);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/teams/:id', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).send();
        }
        await team.remove();
        res.send(team);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;