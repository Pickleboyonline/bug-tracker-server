/**
 * AnnouncementController
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
    create: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { title, projectId, body } = req.body;
        if (!(title && projectId)) return res.badRequest("Must give both title and projectId")


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_ANNOUNCEMENTS
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }


        let announcement = await Announcement.create({
            title,
            project: projectId,
            body: '' + body,
            submitter: user.id,
            submitterName: user.name,
            submitterEmail: user.email,
            plainTextBody: ('' + body).replace(/<[^>]+>/g, '').replace(/(\r\n|\n|\r)/gm, "")
        }).fetch();

        // send out notifications
        let project = await Project.findOne({ id: projectId }).populate('members')
        let membersIds = project.members.map(doc => doc.id)
        membersIds.push(project.owner)

        for (let i = 0; i < membersIds.length; i++) {
            if (membersIds[i] === user.id) continue;
            await Notification.createAndSendNotification({
                recipient: membersIds[i],
                title: 'New Announcement',
                description: user.name + ' has made an announcement.',
                type: 'NEW_ANNOUNCEMENT',
                payload: {
                    projectId: projectId,
                    announcementId: announcement.id
                }
            })
        }


        return res.json({
            message: 'Announcement was created',
            announcement
        })
    },
    get: async (req, res) => {

        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { search, sortBy, limit, skip, projectId, announcementId } = req.query;







        // support 1 announcement
        if (announcementId) {
            let announcement = await Announcement.findOne({ id: announcementId }).populate('submitter');

            if (announcement) {
                // Ensure user is authorized (for diff request)
                try {
                    let isAuthed = await sails.helpers.isAuthed.with({
                        userId: user.id,
                        projectId: announcement.project,
                        permission: PERMISSIONS.MODIFY_BUGS // default permission
                    });
                    if (!isAuthed) {
                        // sails.log("FORBIDDEn")
                        res.status(403);
                        return res.send("Forbidden: you do not have the necessary permissions")
                    }

                } catch (e) {
                    return res.serverError(e)
                }

                let { name, email, id } = announcement.submitter
                announcement.submitter = {
                    name, email, id
                }
                return res.json({
                    announcement
                })
            } else {
                return res.notFound
            }
        }

        if (!projectId) return res.badRequest();

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId,
                permission: PERMISSIONS.MODIFY_BUGS // default permission
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }

        let criteria = {};
        let countCriteria = {};

        if (search) {
            let obj = {
                or: [
                    { submitterName: { contains: search }, project: projectId },
                    { title: { contains: search }, project: projectId },
                    { plainTextBody: { contains: search }, project: projectId },
                    { submitterEmail: { contains: search }, project: projectId },
                ]
            }
            criteria.where = obj;
            countCriteria.where = obj;
        } else {
            criteria.where = { project: projectId };
            countCriteria.where = { project: projectId }
        }

        // criteria = { ...criteria, sortBy, limit: 5, skip };
        if (limit) criteria.limit = limit;
        if (sortBy) criteria.sort = sortBy;
        criteria.sort = 'updatedAt DESC'
        if (skip) criteria.skip = skip;

        // sails.log(criteria)

        let announcements = await Announcement.find(criteria).populate('submitter');
        let total = await Announcement.count(countCriteria);

        return res.json({
            announcements,
            total
        })

    }

};

