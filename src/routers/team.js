const express = require('express');
const Team = require('../models/team');
const Member = require('../models/member');
const { auth, editPermission } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');
const router = new express.Router();

router.post('', auth, async (req, res) => {
    try {
        const details = req.body;
        if (req.body.leader) {
            const leader = await Member.findOne({ IDF_number: req.body.leader });
            if (!leader) {
                return res.status(StatusCodes.BAD_REQUEST).send();
            }
            details.leader = leader._id;
            leader.isLeader = true;
            await leader.save();
        }
        const team = new Team(details);
        await team.save();
        res.status(StatusCodes.CREATED).send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
});

router.get('', auth, async (req, res) => {
    try {
        const teams = await Team.find({});
        if (!teams) {
            return res.status(StatusCodes.NOT_FOUND).send();
        }
        res.send(teams);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
});

router.get('/:id/getLeader', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(StatusCodes.BAD_REQUEST).send("Team not found.");
        }
        if (!team.leader) {
            return res.status(StatusCodes.NOT_FOUND).send('There is no leader for this team.');
        }
        await team.populate('leader');
        res.send(team.leader);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
});

router.get("/:id/membersCount", auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(StatusCodes.BAD_REQUEST).send();
        }
        await team.populate("members");
        res.send(team.members.length.toString());
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send();
        }
        res.send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
});

router.patch('/:id', [auth, editPermission], async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'leader'];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
        return res.status(StatusCodes.BAD_REQUEST).send({ error: "Invalid updates!" });
    }
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send();
        }
        const details = req.body;
        if (req.body.leader) {
            const leader = await Member.findOne({ IDF_number: req.body.leader });
            if (!leader) {
                return res.status(StatusCodes.BAD_REQUEST).send();
            }
            if (team.leader && !team.leader.equals(leader._id)) {
                await team.populate('leader');
                team.leader.isLeader = false;
                await team.leader.save();
            }
            details.leader = leader._id;
            leader.isLeader = true;
            leader.team = team._id;
            await leader.save();
        }
        updates.forEach((update) => (team[update] = details[update]));
        await team.save();
        res.send(team);
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).send(error);
    }
});

router.delete('/:id', [auth, editPermission], async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(StatusCodes.NOT_FOUND).send();
        }
        await team.remove();
        res.send(team);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
});

module.exports = router;