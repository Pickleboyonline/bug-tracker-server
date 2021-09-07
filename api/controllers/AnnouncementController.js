/**
 * AnnouncementController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


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

        let announcement = await Announcement.create({
            title,
            project: projectId,
            body: '' + body,
            submitter: user.id,
            submitterName: user.name,
            submitterEmail: user.email,
            plainTextBody: ('' + body).replace(/<[^>]+>/g, '').replace(/(\r\n|\n|\r)/gm, "")
        })

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

        let { search, sortBy, limit, skip, projectId } = req.query;
        if (!projectId) return res.badRequest("Must provbi")
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
        if (sortBy) criteria.sortBy = sortBy;
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

