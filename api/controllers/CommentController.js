/**
 * CommentController
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
        const { bugId, body } = req.body;

        if (!(body && bugId)) return res.badRequest('Must provide body and bugId!');

        let bug = await Bug.findOne({ id: bugId });

        if (!bug) return res.badRequest('Bug not found')

        let comment = await Comment.create({
            bug: bugId,
            body: body,
            owner: user.id,
            bug: bug.id,
            bodyPlainText: body.replace(/<[^>]+>/g, '').replace(/(\r\n|\n|\r)/gm, "")
        }).fetch();

        return res.json({
            message: 'comment was created!',
            comment
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
        const { bugId } = req.query;
        if (!bugId) return res.badRequest("Must provide bugId")


        let comments = await Comment.find({ bug: bugId }).populate('owner');

        return res.json({
            comments
        })

    }
};

