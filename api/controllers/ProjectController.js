/**
 * ProjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Project = require("../models/Project");


module.exports = {
    join: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { projectId } = req.body;

        let project = await Project.findOne({ id: projectId })
        if (!project) throw new Error('Project not found!')

        if (user.id !== project.owner) {
            await User.addToCollection(user.id, 'projectsJoined', projectId)
        }


        return res.json({
            title: project.title
        })
    },

    create: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { title, description, members } = req.body;
        description = description || '';
        members = '' + members;
        members = members.split(',');
        //sails.log(members)


        let project = await Project.create({ title, description, owner: user.id }).fetch();


        for (let i = 0; i < members.length; i++) {

            if (members[i] === user.id) {
                continue;
            }
            let member = await User.findOne({ id: members[i] });
            if (member) {
                await Project.addToCollection(project.id, 'members', member.id);
            }
        }

        return res.json(project)
    },

    find: async (req, res) => {
        const { projectId } = req.query;

        //  let project = await Project.findOne({ where: { id: projectId }, select: ['title'] }).populate('icon');
        let project = await Project.findOne({ where: { id: projectId } }).populate('icon');

        if (!project) res.notFound();

        return res.json({ project })
    },

    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId } = req.params;
        const { title, description } = req.body;

        let project = await Project.updateOne({ id: projectId }).set({
            title,
            description
        })

        if (project) {
            return res.json({
                project
            })
        } else {
            return res.badRequest("Project does not exist")
        }
    },

    all: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let projects = [];

        await Project.stream({}).populate('members').populate('icon').eachRecord((record) => {

            for (elem of record.members) {
                if (elem.id === user.id) {
                    projects.push({
                        title: record.title,
                        createdAt: record.createdAt,
                        id: record.id,
                        owner: record.owner,
                        icon: {
                            id: (() => {
                                if (record.icon && record.icon[0]) {
                                    return record.icon[0].id
                                }
                                return undefined
                            })()
                        }
                    });
                    break;
                }
            }
            if (record.owner === user.id) {
                projects.push({
                    title: record.title,
                    createdAt: record.createdAt,
                    id: record.id,
                    owner: record.owner,
                    icon: {
                        id: (() => {
                            if (record.icon && record.icon[0]) {
                                return record.icon[0].id
                            }
                            return undefined
                        })()
                    }
                });
            }
        });

        // remove sensitive info


        return res.json({ projects })
    },

    // DELETE /project/member
    // remove user from project
    removeUser: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        // TODO: add permission helper
        const { userId, projectId } = req.body;

        await Project.removeFromCollection(projectId, 'members', userId);

        return res.json({
            success: true
        })
    },

    // POST /project/member
    inviteUser: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        const { userEmails, projectId } = req.body;
        // TODO: check permissions
        if (!(userEmails && projectId)) return res.badRequest('Must provide userEmails and projectId');

        let userEmailsArray = userEmails.split(',');
        let usersInApp = [];
        let usersNotInApp = [];

        for (let i = 0; i < userEmailsArray.length; i++) {
            if (userEmailsArray[i] === '') continue;

            let user = await User.findOne({
                email: userEmailsArray[i]
            });

            if (user) {
                await Project.addToCollection(projectId, 'members', user.id);
            } else {
                // TODO: send email for invite
            }
        }
    },

    // GET /project/stats/:projectId
    getStats: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        // verify user is in project
        const { projectId } = req.params;

        let project = await Project.findOne({ id: projectId }).populate('members', { id: user.id });
        if (!project) return res.notFound();

        if (project.members.length !== 0 || project.owner === user.id) {
            // collect the following:
            //  total members
            //  total bugs
            //  total bugs open
            //  total bugs closed
            let totalBugs = await Bug.count({ project: projectId });
            let totalBugsOpen = await Bug.count({ project: projectId, status: 'open' });
            let totalBugsClosed = totalBugs - totalBugsOpen;
            let { members } = await Project.findOne({ id: projectId }).populate('members');

            return res.json({
                totalBugs, totalBugsClosed, totalBugsOpen, totalMembers: members.length, success: true
            })
        } else {
            return res.forbidden()
        }
    },

    users: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId } = req.params;
        let { search, skip, limit } = req.query;
        let subCriteria = {};

        if (search) {
            subCriteria.where = {
                or: [
                    {
                        email: { contains: search },
                    },
                    {
                        name: { contains: search },
                    },
                ]
            }
        }

        subCriteria.select = ['name', 'email'];

        let project = await Project.findOne({
            id: projectId
        }).populate('members', subCriteria).populate('owner').meta({
            makeLikeModifierCaseInsensitive: true
        });;

        if (!project) return res.notFound();

        let members;

        if (search) {
            if (project.owner.name.toLowerCase().includes(search.toLowerCase()) || project.owner.email.toLowerCase().includes(search.toLowerCase())) {
                members = [project.owner, ...project.members]
            } else {
                members = project.members
            }

        } else {
            members = [project.owner, ...project.members]
        }

        let newMembers = []
        skip = Math.min(Math.abs(skip), members.length)
        stopAt = Math.min(Math.abs(limit) + skip, members.length);



        for (let i = skip; i < stopAt; i++) {
            newMembers.push(members[i])
        }


        return res.json({
            members: newMembers,
            total: members.length
        })

    }

};

