const express = require('express');
const Member = require('../models/member');
const Team = require('../models/team');
const { auth, editPermission } = require('../middleware/auth');
const router = new express.Router();

router.post('', async (req, res) => {
    const details = req.body;
    if (details.team) {
        const team = await Team.findOne({ name: req.body.team });
        if (!team) {
            return res.status(400).send();
        }
        details.team = team._id;
    }
    details.enlistmentDate = new Date (details.enlistmentDate);
    const member = new Member(details);
    try {
        await member.save();
        const token = await member.generateAuthToken();
        res.status(201).send({ member, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/login', async (req, res) => {
    try {
        const member = await Member.findByCredentials(req.body.IDF_number, req.body.password);
        const token = await member.generateAuthToken();
        res.send({ member, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/logout', auth, async (req, res) => {
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

router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.member.tokens = [];
        await req.member.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get('', auth, async (req, res) => {
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

router.get('/me', auth, async (req, res) => {
    res.send(req.member);
});

router.get("/nonLeaders", auth, async (req, res) => {
    try {
        const nonLeaders = await Member.find({ isLeader: false });
        const names = nonLeaders.map(member => member.name);
        res.send(names);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/newMembers', auth, async (req, res) => {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const newMembers = await Member.find({ enlistmentDate: { $gt: oneYearAgo.getTime() } }).limit(5).skip(parseInt(req.query.skip));
        res.send(newMembers);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/dateSortedMembers', auth, async(req, res) => {
    try {
        const sort = {};
        if (req.query.sortBy) {
            // const parts = req.query.sortBy.split(":");
            // sort[parts[0]] = (parts[1] === "desc") ? -1 : 1;
            sort.enlistmentDate = req.query.sortBy === "desc" ? -1 : 1;
        }
        const members = await Member.find({}).sort(sort);
        res.send(members);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get("/:id/getTeam", auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(400).send();
    }
    if (!member.team) {
      return res.send("This member is not on a team yet");
    }
    await member.populate("team");
    res.send(member.team);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/:id", auth, async (req, res) => {
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

router.patch("/:id", [auth, editPermission], async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "IDF_number", "password", "team"];
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" });
    }

    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).send();
        }
        const details = req.body;
        if (details.team) {
            const team = await Team.findOne({ name: req.body.team });
            if (!team) {
                return res.status(400).send();
            }
            details.team = team._id;
        }
        updates.forEach((update) => (member[update] = details[update]));
        await member.save();
        res.send(member);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete("/:id", [auth, editPermission], async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).send();
        }
        await member.remove();
        res.send(member);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;