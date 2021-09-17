/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
    // POST /messsage/:userId
    sendMessage: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let userId = req.body.userId || req.params.userId;
        let body = req.body.body || req.query.body
        if (userId === user.id) return res.badRequest("You can not message yourself")
        // TODO: ensure that both users are in the same project 

        // search for conversation, create one if not found

        // let convo = await Conversation.findOne({ participants: { contains: userId } });
        let convo = await Conversation.findOne({ participants: [userId + ',' + user.id, user.id + ',' + userId] });

        if (!convo) {
            convo = await Conversation.create({
                participants: userId + ',' + user.id,
                lastMessageText: body
            }).fetch();
        }

        let message = await Message.create({
            body,
            sender: user.id,
            reciever: userId
        }).fetch();

        await Conversation.addToCollection(convo.id, 'messages', message.id);
        await Conversation.update({ id: convo.id }).set({ lastMessageText: body });


        message = await Message.findOne(message.id).populate('conversation').populate('sender').populate('reciever')

        const cleanUser = (user) => ({ name: user.name, id: user.id, email: user.email })

        message.sender = cleanUser(message.sender);
        message.reciever = cleanUser(message.reciever);
        message.sender.isYou = true

        let messageToSend = { ...message };
        messageToSend.sender = { ...messageToSend.sender };
        messageToSend.sender.isYou = false


        sails.sockets.broadcast(userId, "new-message", messageToSend);


        // Attach recipient to conversation
        message.conversation
        let reciepent;
        let users = message.conversation.participants.split(',');

        if (users[0] !== user.id) {
            reciepent = await User.findOne({ id: users[0] }).select(['name', 'email'])
        } else {
            reciepent = await User.findOne({ id: users[1] }).select(['name', 'email'])
        }

        message.conversation.reciepent = reciepent
        message.conversation.recipient = reciepent


        //  maintain unread notiofications

        Notification.createAndSendNotification({
            recipient: userId,
            type: 'NEW_MESSAGE',
            title: 'New Message',
            description: user.name + ' has sent you a message!',
            extra: convo.id,
            payload: {
                conversationId: convo.id
            }
        })

        // sails.sockets.blast('new-message', message)
        return res.json({
            success: true,
            message
        })
    },

    // GET /conversation/all
    // return all conversations
    getConversation: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        // const {search} = req.query;

        let conversations = await Conversation.find({
            participants: { contains: user.id }
        }).sort('updatedAt DESC');

        for (let i = 0; i < conversations.length; i++) {
            let reciepent;
            let users = conversations[i].participants.split(',');

            if (users[0] !== user.id) {
                reciepent = await User.findOne({ id: users[0] }).select(['name', 'email'])
            } else {
                reciepent = await User.findOne({ id: users[1] }).select(['name', 'email'])
            }

            conversations[i].reciepent = reciepent
            conversations[i].recipient = reciepent

            // add newMessages => 
            let notifications = await Notification.find({
                read: false,
                extra: conversations[i].id,
                recipient: user.id
            });

            let conversationIdsWithUnreadMessages = notifications.map(doc => doc.extra);
            if (conversationIdsWithUnreadMessages.includes(conversations[i].id)) {
                conversations[i].newMessages = true;
            } else {
                conversations[i].newMessages = false;
            }
        }



        return res.json({
            conversations
        })
    },

    // GET /conversation/:conversationId
    getMessages: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let conversationId = req.params.conversationId;
        if (!conversationId) return res.badRequest();

        let limit = req.query.limit || 50;
        let skip = req.query.skip || 0;

        // TODO: validate that user is in convo

        let conversation = await Conversation.findOne({ id: conversationId })// .populate('messages', { sort: 'createdAt DESC' });

        if (!conversation) return res.notFound();

        // let totalMessages = conversation.messages.length;
        // let { messages } = await Conversation.findOne({ id: conversationId }).populate('messages', { sort: 'createdAt DESC', limit, skip });

        let messages = await Message.find({ where: { conversation: conversation.id }, limit, skip, sort: 'createdAt DESC' }).populate('sender').populate('reciever');
        let total = await Message.count({ conversation: conversation.id });

        // add isYou field, and select email and name only
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].sender.id === user.id) {
                messages[i].sender = {
                    isYou: true,
                    name: messages[i].sender.name,
                    email: messages[i].sender.email,
                    id: messages[i].sender.id
                }
            } else {
                messages[i].sender = {
                    isYou: false,
                    name: messages[i].sender.name,
                    email: messages[i].sender.email,
                    id: messages[i].sender.id
                }
            }

            if (messages[i].reciever.id === user.id) {
                messages[i].reciever = {
                    isYou: true,
                    name: messages[i].reciever.name,
                    email: messages[i].reciever.email,
                    id: messages[i].reciever.id
                }
            } else {
                messages[i].reciever = {
                    isYou: false,
                    name: messages[i].reciever.name,
                    email: messages[i].reciever.email,
                    id: messages[i].reciever.id
                }
            }

        }

        // read notifications
        await Notification.update({
            extra: conversationId,
            recipient: user.id
        }).set({ read: true })

        return res.json({
            messages,
            total
        })
    },

    // PATCH /message/read/:conversationId
    readMessages: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { conversationId } = req.params;

        // read notifications
        await Notification.update({
            extra: conversationId,
            recipient: user.id
        }).set({ read: true })

        return res.json({
            success: true
        })
    },

    // POST /message/subscribe
    subscribe: async (req, res) => {
        // sails.log('request!')
        if (!req.isSocket) {
            return res.badRequest('Must be socket request');
        }
        // sails.log(req.headers)
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        sails.sockets.join(req.socket, user.id)

        return res.json({
            success: true,
            message: "You are now subscribed to messages"
        })
    },

    // POST /message/unsubscribe
    unsubscribe: async (req, res) => {
        // sails.log('request!')
        if (!req.isSocket) {
            return res.badRequest('Must be socket request');
        }
        // sails.log(req.headers)
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        sails.sockets.leave(req.socket, user.id)

        return res.json({
            success: true,
            message: "You are now unsubscribed to messages"
        })
    }



};

