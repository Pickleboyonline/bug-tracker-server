/**
 * UploadedFileController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

//const Bug = require("../models/Bug");
//const UploadedFile = require("../models/UploadedFile");

// const UploadedFile = require("../models/UploadedFile");

module.exports = {
    upload: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { bugId } = req.query;

        if (!bugId) return res.badRequest('No bug ID provided!')

        let bug = await Bug.findOne({ id: bugId });

        if (!bug) res.badRequest('No bug found')

        if (bug.submitter !== user.id) return res.forbidden();


        req.file('files').upload({
            maxBytes: 10000000
        }, async (err, uploadedFiles) => {
            if (err) {
                return res.serverError(err)
            }

            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded')
            }

            for (let i = 0; i < uploadedFiles.length; i++) {

                let file = await UploadedFile.create({
                    name: uploadedFiles[i].filename,
                    location: uploadedFiles[i].fd,
                    uploader: user.id
                }).fetch();
                uploadedFiles[i].id = file.id;
                await Bug.addToCollection(bugId, 'files', file.id)

                // TODO: ensure old icon is removed


            }
            return res.json({ uploadedFiles })
        })
    },

    delete: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { fileId } = req.params;
        //  if (!fileId) return res.badRequest('No fileId give')

        let file = await UploadedFile.findOne({ id: fileId });
        if (!file) res.badRequest('File not found')
        await Bug.removeFromCollection(file.bug, 'files', file.id);
        await UploadedFile.destroyOne({ id: file.id })

        return res.json({ message: 'file deleted!', file })

    },

    get: async (req, res) => {
        // var user;
        // try {
        //     user = await sails.helpers.authentication(req);
        // } catch (e) {
        //     sails.log(e)
        //     return res.forbidden()
        // }
        const { fileId } = req.params;
        //  if (!fileId) return res.badRequest('No fileId give')

        let file = await UploadedFile.findOne({ id: fileId });
        if (!file) res.badRequest('File not found');


        res.set("Content-disposition", `attachment; filename="${file.name}`);

        var SkipperDisk = require('skipper-disk');
        var fileAdapter = SkipperDisk(/* optional opts */);

        // Stream the file down
        fileAdapter.read(file.location)
            .on('error', function (err) {
                return res.serverError(err);
            })
            .pipe(res);
    }

};

