/**
 * NotificationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    // GET /notification
    getAll: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { limit, skip } = req.query;
        limit = Math.min(limit, 100)

        let notifications = await Notification.find({
            where: {
                recipient: user.id,
                // dismissed: false
            },
            sort: 'createdAt DESC',
            limit, skip
        });

        let notificationIds = notifications.map(doc => doc.id);


        if (notificationIds.length > 0) {
            await Notification.update({
                id: { in: notificationIds }
            }).set({
                read: true
            })
        }

        // for (let i = 0; i < notificationIds.length; i++) {
        //     await Notification.updateOne({ recipient: notificationIds[i] }).set({ read: true })
        // }


        let totalNotifications = await Notification.count({ recipient: user.id });
        let totalUnreadNotifcations = await Notification.count({
            recipient: user.id,
            read: false
        })

        return res.json({
            notifications,
            totalNotifications,
            totalUnreadNotifcations
        })
    },

    // DELETE /notification/:notificationId
    deleteOne: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let { notificationId } = req.params;

        let notification = await Notification.destroyOne({ id: notificationId });

        if (!notification) return res.notFound();

        return res.json({
            notification
        })
    },

    // DELETE /notification/all
    deleteAll: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }


        await Notification.destroy({ recipient: user.id });

        return res.json({
            success: true
        })
    },
};

