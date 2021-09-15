
/**
 * UploadedImageController
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
    upload: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId } = req.query;

        if (!projectId) return res.badRequest('No project ID given')

        let project = await Project.findOne({ id: projectId }).populate('icon');

        if (!project) res.badRequest('No project found')


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_GENERAL
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.serverError(e)
        }

        req.file('icon').upload({
            maxBytes: 10000000
        }, async (err, uploadedFiles) => {
            if (err) {
                return res.serverError(err)
            }

            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded')
            }

            // remove prev icon
            let prevIcons = project.icon;
            for (let i = 0; i < prevIcons.length; i++) {
                await Project.removeFromCollection(projectId, 'icon', prevIcons[i].id);
                await UploadedImage.destroyOne({ id: prevIcons[i].id })
            }

            let icon = await UploadedImage.create({
                name: uploadedFiles[0].filename,
                location: uploadedFiles[0].fd,

            }).fetch();

            await Project.addToCollection(projectId, 'icon', icon.id)

            uploadedFiles[0].id = icon.id;

            return res.json({ uploadedFiles })
        })
    },

    get: async (req, res) => {
        const { id } = req.params;

        let icon = await UploadedImage.findOne({ id });

        if (!icon) return res.badRequest('Icon not found!')

        res.set("Content-disposition", `attachment; filename="${icon.name}"`);

        var SkipperDisk = require('skipper-disk');
        var fileAdapter = SkipperDisk(/* optional opts */);

        // Stream the file down
        fileAdapter.read(icon.location)
            .on('error', function (err) {
                return res.serverError(err);
            })
            .pipe(res);
    },

    // POST /user/icon
    uploadUserIcon: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        req.file('icon').upload({
            maxBytes: 10000000
        }, async (err, uploadedFiles) => {
            if (err) {
                return res.serverError(err)
            }

            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded')
            }

            await UserIcon.destroy({ user: user.id });

            let icon = await UserIcon.create({
                name: uploadedFiles[0].filename,
                location: uploadedFiles[0].fd,
            }).fetch();

            await User.replaceCollection(user.id, 'icon').members([icon.id])
            await User.updateOne({ id: user.id }).set({ iconId: icon.id })

            uploadedFiles[0].id = icon.id;

            return res.json({ uploadedFiles })
        })
    },

    // GET /user/icon/:id
    getUserIcon: async (req, res) => {
        const { id } = req.params;

        let icon = await UserIcon.findOne({ id });

        if (!icon) return res.badRequest('Icon not found!')

        res.set("Content-disposition", `attachment; filename="${icon.name}"`);
        res.set('Cache-Control', 'no-cache')
        var SkipperDisk = require('skipper-disk');
        var fileAdapter = SkipperDisk(/* optional opts */);

        // Stream the file down
        fileAdapter.read(icon.location)
            .on('error', function (err) {
                return res.serverError(err);
            })
            .pipe(res);
    },

};

