/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const User = require('../models/User');
const KEY = 'fbdahjsbf@%&@#!disa213g129b12fdas';

module.exports = {
    // inputs: password, email
    // returns-s: token
    // fails: err
    login: async (req, res) => {
        const { password, email } = req.body;

        if (!(password && email)) return res.badRequest(new Error('must provide password and email'));

        let user = await User.findOne({ email });
        if (!user) throw new Error('No user found');

        var hash = user.password;
        var isCorrectPassword = await bcrypt.compare(password, hash);

        if (isCorrectPassword) {
            var token = await (new Promise((res) => {

                let result = jwt.sign({ email, iat: (new Date()).getTime() }, KEY);
                res(result);

            }));

            return res.json({ message: 'Login Successful', token })
        } else {
            return res.badRequest(new Error('Incorrect password'))
        }
    },


    signup: async (req, res) => {
        const { password, name, email } = req.body;

        if (!(password && email && name)) return res.badRequest(new Error('must provide password, name, and email'));

        let passswordHash = await bcrypt.hash(password, 10);

        try {
            await User.create({ password: passswordHash, name, email, passLastModified: (new Date().getTime()) });
        } catch (e) {
            return res.badRequest(e);
        }

        var token = await (new Promise((res) => {

            let result = jwt.sign({ email, iat: (new Date()).getTime() }, KEY);
            res(result);

        }));

        return res.json({ message: 'user created', token })

    },

    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
    },

    search: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let { query } = req.query;

        if (!query) return res.json({ results: [] });

        query = '' + query;
        // sails.log(query);

        let users = await User.find({
            where: {
                or:
                    [
                        { name: { 'contains': query } },
                        { email: { 'contains': query } }
                    ]
            },
            limit: 5,
            sort: 'name ASC',
            select: ['name', 'email']
        }).meta({
            makeLikeModifierCaseInsensitive: true
        });

        // // remove sensitive data
        // let cleanedUsers = users.map((doc) => {
        //     return {
        //         email: doc.email,
        //         id: doc.id,
        //         name: doc.name,
        //     }
        // })
        return res.json({ results: users })
    }

};

