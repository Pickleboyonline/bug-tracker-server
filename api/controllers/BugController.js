/**
 * BugController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


// PERMISSIONS: 
// MODIFY_BUGS

const PERMISSIONS = {
    ALL: 'ALL',
    MODIFY_GENERAL: 'MODIFY_GENERAL',
    MODIFY_MEMBERS: 'MODIFY_MEMBERS',
    MODIFY_BUGS: 'MODIFY_BUGS',
    MODIFY_ANNOUNCEMENTS: 'MODIFY_ANNOUNCEMENTS'
}

module.exports = {

    // POST /bug/create
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

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }

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
                await Bug.addToCollection(bug.id, 'assignedTo', assignees[i]);

                if (assignees[i] === user.id) continue;
                await Notification.createAndSendNotification({
                    recipient: assignees[i],
                    title: 'Assigned to Bug',
                    description: user.name + ` has assigned you to bug "${bug.title}"`,
                    type: 'NEW_BUG',
                    payload: {
                        projectId: projectId,
                        bugId: bug.id
                    }
                })
            }
        }

        // send out notification
        let project = await Project.findOne({ id: projectId }).populate('members')
        let membersIds = project.members.map(doc => doc.id)
        membersIds.push(project.owner)
        for (let i = 0; i < membersIds.length; i++) {
            if (membersIds[i] === user.id) continue;
            await Notification.createAndSendNotification({
                recipient: membersIds[i],
                title: 'New Bug',
                description: user.name + ' has submitted a new bug.',
                type: 'NEW_BUG',
                payload: {
                    projectId: projectId,
                    bugId: bug.id
                }
            })
        }


        return res.json(bug)


    },

    // GET /bug/assignee
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

    // DELETE /bug/assignee
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

        let bug = Bug.findOne({ id: bugId });
        if (!bug) return res.notFound();

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: bug.project,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }

        await Bug.removeFromCollection(bugId, 'assignedTo', userId);

        // await Bug.updateOne({ id: bugId }).valuesToSet({
        //     totalAssignees: bug.totalAssignees + assignees.length
        // })

        return res.json({ message: 'DONE' })
    },

    // POST /bug/assignee
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


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: bug.project,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }


        for (let i = 0; i < userIds.length; i++) {
            await Bug.addToCollection(bugId, 'assignedTo', userIds[i]);
        }
        return res.json({
            message: 'users added!'
        })
    },

    // GET /bug/all
    all: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const {
            projectId,
            skip,
            limit,
            search,
            sortBy,
            order,
            status,
        } = req.query;

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }


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
                        project: projectId,
                        ...(status ? { status } : {})
                    },
                    {
                        plainTextDescription: { contains: search },
                        project: projectId,
                        ...(status ? { status } : {})
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

    // GET /bug/:bugId
    getOne: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { bugId } = req.params;
        let bug = await Bug.findOne({ id: bugId }).populate('submitter').populate('files');

        if (!bug) return res.notFound()


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: bug.project,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }

        return res.json({
            bug
        })

    },

    // DELETE /bug/:bugId
    deleteOne: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { bugId } = req.params;
        let bug = await Bug.findOne({ id: bugId }).populate('submitter').populate('files');

        if (!bug) return res.notFound()


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: bug.project,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }
        } catch (e) {
            return res.serverError(e)
        }


        await Bug.destroyOne({ id: bug.id });

        return res.json({
            bug,
            success: true,
            message: 'bug was deleted'
        })

    },

    // updates bug given ID
    // input:
    //  description, tags, dueDta, severity, reporducibility, catagory
    // returns:
    // updated bug
    // PUT /bug/:bugId
    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        const { bugId } = req.params;

        const {
            description,
            tags,
            dueDate,
            severity,
            reproducibility,
            catagory,
            status
        } = req.body;

        let valuesToSet = {};
        if (!bugId) return res.badRequest('No bug Id provided');

        let bug = await Bug.findOne({ id: bugId });
        if (!bug) return res.notFound();

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: bug.project,
                permission: PERMISSIONS.MODIFY_BUGS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }





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

