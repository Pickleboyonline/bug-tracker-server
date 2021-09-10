/**
 * NotificationSettingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
    // PUT /notification-setting/:projectId
    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId } = req.params;
        const { recieveNotifications } = req.body;

        let doc = await NotificationSetting.findOne({
            project: projectId,
            user: user.id
        });

        if (doc) {
            await NotificationSetting.updateOne({
                id: doc.id
            }).set({
                recieveNotifications
            })
        } else {
            await NotificationSetting.create({
                project: projectId,
                user: user.id,
                recieveNotifications: recieveNotifications
            });
        }

        return res.json({
            message: 'Setting was updated'
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

        const { projectId } = req.params;
        let doc = await NotificationSetting.findOne({
            project: projectId,
            user: user.id
        });

        if (doc) {
            return res.json({
                notificationSetting: doc
            })
        } else {
            let newDoc = await NotificationSetting.create({
                project: projectId,
                user: user.id,
            }).fetch();

            return res.json({
                notificationSetting: newDoc
            })
        }
    }
};

