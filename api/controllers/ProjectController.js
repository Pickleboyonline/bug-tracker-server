/**
 * ProjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


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
    }

};

