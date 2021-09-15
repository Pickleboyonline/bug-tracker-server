/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");



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

        // sails.log("MESSAGE SENT to " + userId);

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


        // TODO: maintain unread notiofications
        // let messageIds = messages.map(doc => doc.id);
        // if (messageIds.length > 0) {
        //     await Message.update({id: {in: messageIds}}).set({read: true});
        //     let totalUnreadMessages = await Message.count({conversation: conversation.id, read: false});
        //     await Conversation.updateOne({id: conversation.id}).set({unreadMessages: totalUnreadMessages});
        // }

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
        let conversationId = req.query.conversationId || req.params.conversationId;
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

        // TODO: maintain unread notifications
        // let messageIds = messages.map(doc => doc.id);
        // if (messageIds.length > 0) {
        //     await Message.update({id: {in: messageIds}}).set({read: true});
        //     let totalUnreadMessages = await Message.count({conversation: conversation.id, read: false});
        //     await Conversation.updateOne({id: conversation.id}).set({unreadMessages: totalUnreadMessages});
        // }

        return res.json({
            messages,
            total
        })
    },

    // POST /message/subscribe
    subscribe: async (req, res) => {
        // sails.log('request!')
        if (!req.isSocket) {
            return res.badRequest('Must be socket request');
        }

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
    }



};

