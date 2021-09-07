/**
 * UploadedImageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */



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

        if (project.owner !== user.id) return res.forbidden();

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

        res.set("Content-disposition", `attachment; filename="${icon.name}`);

        var SkipperDisk = require('skipper-disk');
        var fileAdapter = SkipperDisk(/* optional opts */);

        // Stream the file down
        fileAdapter.read(icon.location)
            .on('error', function (err) {
                return res.serverError(err);
            })
            .pipe(res);
    }

};

