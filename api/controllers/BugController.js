/**
 * BugController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// const Bug = require("../models/Bug");
const { htmlToText } = require('html-to-text');



module.exports = {
    create: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let {
            title,
            tags,
            dueDate,
            severity,
            reproducibility, description, assignees,
            catagory, projectId } = req.body;

        let submitter = user.id;
        description = description || ''

        let bug = await Bug.create({
            submitter,
            title,
            tags,
            dueDate,
            severity,
            reproducibility,
            catagory,
            submitter: user.id,
            description,
            plainTextDescription: description.replace(/<[^>]+>/g, '').replace(/(\r\n|\n|\r)/gm, ""),
            project: projectId
        }).fetch();

        if (assignees) {
            //sails.log(assignees)
            assignees = assignees.split(',');
            //sails.log(assignees)
            for (let i = 0; i < assignees.length; i++) {
                await Bug.addToCollection(bug.id, 'assignedTo', assignees[i])

            }
        }
        // await Bug.updateOne({ id: bugId }).valuesToSet({
        //     totalAssignees: bug.totalAssignees + assignees.length
        // })


        return res.json(bug)


    },


    searchAssignees: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { bugId, search, limit, skip } = req.query;

        if (!(bugId)) return res.badRequest('Must provide bugId')

        if (limit) {
            if (limit > 10) limit = 10;
        }

        let subCriteria = {};

        if (search) {
            subCriteria.where = {
                or: [
                    { email: { contains: search } },
                    { name: { contains: search } }
                ]
            }
        }
        //sails.log(subCriteria.where)
        //subCriteria.limit = limit;
        // subCriteria.skip = skip;
        subCriteria.select = ['name', 'email']


        let bugWithUsers = await Bug.findOne({ id: bugId }).populate('assignedTo', subCriteria).meta({
            makeLikeModifierCaseInsensitive: true
        });

        if (!bugWithUsers) return res.badRequest("Bug not found");

        return res.json({
            users: bugWithUsers.assignedTo,
            total: bugWithUsers.assignedTo.length
        })

    },


    removeAssignee: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { bugId, assigneeId } = req.query;

        let userId = await User.findOne({ id: assigneeId });

        if (!userId) return res.badRequest("No user exists");

        if (!bugId) return res.badRequest('No bug ID provided');

        await Bug.removeFromCollection(bugId, 'assignedTo', userId);

        // await Bug.updateOne({ id: bugId }).valuesToSet({
        //     totalAssignees: bug.totalAssignees + assignees.length
        // })

        return res.json({ message: 'DONE' })
    },


    addAssignee: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { assignees, bugId } = req.body;
        assignees = assignees || '';
        assignees = new String(assignees);

        let userIds = assignees.split(',');

        if (!bugId) return res.badRequest("Must provide pubId")
        let bug = await Bug.findOne({ id: bugId });

        if (!bug) return res.badRequest("Bug not found")

        for (let i = 0; i < userIds.length; i++) {
            await Bug.addToCollection(bugId, 'assignedTo', userIds[i]);
        }
        return res.json({
            message: 'users added!'
        })
    },


    all: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId, skip, limit, search, sortBy, order } = req.query;

        if (limit && limit > 100) limit = 100;


        let bugs;
        let total;
        let criteria = {};
        let countCriteria = {};


        if (skip && limit) {
            criteria.limit = limit;
            criteria.skip = skip;
        }

        if (search) {
            let temp = {
                or: [
                    {
                        title: { contains: search },
                        project: projectId
                    },
                    {
                        plainTextDescription: { contains: search },
                        project: projectId
                    },
                ]
            }
            criteria.where = temp;
            countCriteria.where = temp;
        } else {
            criteria.where = { project: projectId }
            countCriteria.where = { project: projectId }
        }


        if (sortBy) {
            let sort;
            if (sortBy === 'upload-date') sort = 'createdAt';
            if (sortBy === 'title') sort = 'title';
            if (sortBy === 'last-modified') sort = 'updatedAt';

            if (order === 'ASC') sort += ' ASC';
            if (order === 'DESC') sort += ' DESC';

            criteria.sort = sort;
            // sails.log(criteria.sort)
        } else {
            criteria.sort = 'updatedAt DESC'
        }

        if (!projectId) {
            criteria.where, countCriteria.where = { owner: user.id }
        }

        bugs = await Bug.find(criteria).populate('submitter').populate('files').meta({
            makeLikeModifierCaseInsensitive: true
        });
        total = await Bug.count(countCriteria).meta({
            makeLikeModifierCaseInsensitive: true
        });

        return res.json({ bugs: bugs, total })


    },

    // updates bug given ID
    // input:
    //  description, tags, dueDta, severity, reporducibility, catagory
    // returns:
    // updated bug
    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        const { bugId } = req.params;
        const { description,
            tags, dueDate,
            severity, reproducibility,
            catagory, status } = req.body;
        let valuesToSet = {};

        if (!bugId) return res.badRequest('No bug Id provided');

        if (description) {
            valuesToSet.description = description;
            valuesToSet.plainTextDescription = description.replace(/<[^>]+>/g, '').replace(/(\r\n|\n|\r)/gm, "");
        }
        valuesToSet = { ...valuesToSet, tags, dueDate, severity, reproducibility, catagory, status }

        let updatedBug = await Bug.updateOne({ id: bugId }).set(valuesToSet)//.fetch();

        return res.json({
            bug: updatedBug
        })
    }

};

