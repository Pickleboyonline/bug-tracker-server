/**
 * ProjectController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


const PERMISSIONS = {
    ALL: 'ALL',
    MODIFY_GENERAL: 'MODIFY_GENERAL',
    MODIFY_MEMBERS: 'MODIFY_MEMBERS',
    MODIFY_BUGS: 'MODIFY_BUGS',
    MODIFY_ANNOUNCEMENTS: 'MODIFY_ANNOUNCEMENTS'
}


module.exports = {

    // swap to invite only/invite code rather than ID code
    // TODO: give default role that has modify bugs
    // TODO: and private/public project functionality
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

        if (user.id === project.owner) return res.json({ project });

        await User.addToCollection(user.id, 'projectsJoined', projectId)


        // join default role
        let defaultRole = await Role.findOrCreate({ project: projectId, title: 'Default' }, {
            project: projectId,
            title: 'Default',
            color: '#007acc'
        });

        await Role.addToCollection(defaultRole.id, 'users', user.id)

        return res.json({
            project
        })
    },

    // "PUBLIC"
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

        // TODO: send invite instead of force invite
        for (let i = 0; i < members.length; i++) {

            if (members[i] === user.id) {
                continue;
            }
            let member = await User.findOne({ id: members[i] });
            if (member) {
                // await Project.addToCollection(project.id, 'members', member.id);

                await Notification.createAndSendNotification({
                    title: 'Project Invitation',
                    description: `You have been invited to join project "${project.title}" by ${user.name}.`,
                    type: 'PROJECT_INVITE',
                    payload: {
                        projectId: project.id
                    },
                    recipient: member.id
                });
            }
        }

        // join default role
        await Role.findOrCreate({ project: project.id, title: 'Default' }, {
            project: project.id,
            title: 'Default',
            color: '#007acc',
            permissions: PERMISSIONS.MODIFY_BUGS
        });

        return res.json(project)
    },

    find: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            // return res.forbidden()
        }

        const { projectId } = req.query;

        //  let project = await Project.findOne({ where: { id: projectId }, select: ['title'] }).populate('icon');
        let project = await Project
            .findOne({ where: { id: projectId } })
            .populate('icon');

        let { roles } = await User.findOne({ id: user.id }).populate('roles', {
            project: projectId,
        });

        if (!project) return res.notFound();

        let permissions = []
        if (user.id === project.owner) {
            permissions = ['ALL']
        } else {
            for (let i = 0; i < roles.length; i++) {
                let permissionsArray = roles[i].permissions.split(',');

                for (let j = 0; j < permissionsArray.length; j++) {
                    let permissionToAdd = permissionsArray[j];
                    if (!permissionToAdd) continue;
                    if (!permissions.includes(permissionToAdd)) permissions.push(permissionToAdd);
                }
            }
        }

        project.yourPermissions = permissions;
        project.permission = permissions;

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


        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_GENERAL
            });
            if (!isAuthed) return res.forbidden()
        } catch (e) {
            return res.serverError(e)
        }




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

        // Validate permissions
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_MEMBERS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }
        let project = await Project.findOne({ id: projectId })

        if (project.owner === user.id) return res.json({ success: true })

        let roles = await Role.find({ project: projectId });

        await Role.removeFromCollection(roles.map((item) => item.id), 'users', userId)
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

        if (!(userEmails && projectId)) return res.badRequest('Must provide userEmails and projectId');
        let project = await Project.findOne({ id: projectId });
        if (!project) return res.notFound("Project not found")

        // Validate permissions
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_MEMBERS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }


        // Determine users to add and remove

        for (let i = 0; i < userEmails.length; i++) {
            // sails.log(userEmails[i])
            if (userEmails[i] === '') continue;

            let user = await User.findOne({
                email: userEmails[i]
            });

            if (user) {
                // TODO: instead of auto add, send notification !
                if (user.id === project.owner) continue;

                await Notification.createAndSendNotification({
                    title: 'Project Invitation',
                    description: `You have been invited to join project "${project.title}" by ${user.name}.`,
                    type: 'PROJECT_INVITE',
                    payload: {
                        projectId: project.id
                    },
                    recipient: user.id
                });

                // await Project.addToCollection(projectId, 'members', user.id);

            } else {
                // TODO: send email for invite
            }
        }



        return res.json({
            success: true
        })
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
                totalBugs, totalBugsClosed, totalBugsOpen, totalMembers: members.length + 1, success: true
            })
        } else {
            return res.forbidden()
        }
    },

    // DELETE /project/:projectId
    deleteProject: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        // verify user is in project
        const { projectId } = req.params;

        let project = await Project.findOne({ id: projectId });

        if (!project) return res.notFound();

        if (project.owner !== user.id) return res.forbidden();

        await Bug.destroy({ project: projectId })
        await Announcement.destroy({ project: projectId })
        await Role.destroy({ project: projectId })
        await Project.destroyOne({ id: projectId });

        return res.json({
            message: 'project was deleted',
            project
        })

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


        project.owner = {
            id: project.owner.id,
            name: project.owner.name,
            email: project.owner.email,
            isOwner: true
        }

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

