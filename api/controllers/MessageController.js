/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

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
        // TODO: ensure that both users are in the same project 

        // search for conversation, create one if not found

        let convo = await Conversation.findOne({ participants: { contains: userId } });

        if (!convo) {
            convo = await Conversation.create({
                participants: userId + ',' + user.id
            });
        }

        let message = await Message.create({
            body,
            sender: user.id,
            reciever: userId
        });

        await Conversation.addToCollection(convo.id, 'messages', message.id);

        // TODO: send message through socket.io helper

        return res.json({
            success: true
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

        let conversations = await Conversation.find({
            participants: { contains: user.id }
        });

        for (let i = 0; i < conversations.length; i++) {
            let reciepent;
            let users = conversations.participants.split(',');

            if (users[0] !== user.id) {
                reciepent = await User.findOne({ id: users[0] }).select(['name', 'email'])
            } else {
                reciepent = await User.findOne({ id: users[1] }).select(['name', 'email'])
            }

            conversations.reciepent = reciepent
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
        let limit = req.query.limit || 20;
        let skip = req.query.skip || 0;

        // TODO: validate that user is in convo

        let conversation = await Conversation.findOne({ id: conversationId }).populate('messages', { sort: 'createdAt DESC' });

        if (!conversation) return res.notFound();

        let totalMessages = conversation.messages.length;
        let { messages } = await Conversation.findOne({ id: conversationId }).populate('messages', { sort: 'createdAt DESC', limit, skip });

        // TODO: populate user info

        return res.json({
            messages,
            total: totalMessages
        })
    },

    // TODO: more like hide conversation, remove on one end should not effect the other
    // removeConversation: async (req, res) => {
    //     var user;
    //     try {
    //         user = await sails.helpers.authentication(req);
    //     } catch (e) {
    //         sails.log(e)
    //         return res.forbidden()
    //     }

    //     // TODO: validate that user is in convo
    // }

};

