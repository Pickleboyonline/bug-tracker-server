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

                let result = jwt.sign({ id: user.id, iat: (new Date()).getTime() }, KEY);
                res(result);

            }));

            return res.json({ message: 'Login Successful', token })
        } else {
            return res.badRequest(new Error('Incorrect password'))
        }
    },

    me: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        user = await User.findOne({ id: user.id });
        const { name, email, id, createdAt, iconId } = user


        return res.json({
            user: { name, email, id, createdAt, iconId }
        })
    },



    // throwError: async (req, res) => {
    //     // return res.forbidden();

    //     return res.serverError('Some stupid error')

    //     return res.send("success")
    // },


    signup: async (req, res) => {
        const { password, name, email } = req.body;

        if (!(password && email && name)) return res.badRequest(new Error('must provide password, name, and email'));

        let passswordHash = await bcrypt.hash(password, 10);

        let user
        try {
            user = await User.create({ password: passswordHash, name, email, passLastModified: (new Date().getTime()) }).fetch();
        } catch (e) {
            return res.badRequest(e);
        }

        var token = await (new Promise((res) => {

            let result = jwt.sign({
                id: user.id,
                iat: (new Date()).getTime()
            }, KEY);
            res(result);

        }));

        return res.json({ message: 'user created', token })

    },


    // PUT /user/update
    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let name, email;

        if (req.body.name) name = req.body.name;
        if (req.body.email) email = req.body.email;

        user = await User.updateOne({ id: user.id }).set({ name, email });

        return res.json({
            user,
            success: true
        })
    },

    // PUT /user/password
    updatePassword: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        const { password, newPassword } = req.body;
        if (!(password && newPassword)) return res.badRequest(new Error("Password and new password needed"))

        var hash = user.password;
        var isCorrectPassword = await bcrypt.compare(password, hash);

        if (!isCorrectPassword) return res.badRequest(new Error('Incorrect password'))

        let newPasswordHash = await bcrypt.hash(newPassword, 10);

        user = await User.updateOne({ id: user.id }).set({
            passLastModified: (new Date()).getTime(),
            password: newPasswordHash
        })

        var token = await (new Promise((res) => {
            let result = jwt.sign({
                id: user.id,
                iat: (new Date()).getTime()
            }, KEY);
            res(result);
        }));

        return res.json({
            message: 'Password Updated',
            token,
            user: {
                name: user.name,
                id: user.id,
                email: user.email
            }
        })


    },

    search: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }
        let { query, projectId, isIn } = req.query;

        if (!query) return res.json({ results: [] });

        query = '' + query;
        // sails.log(query);

        let criteria = {
            where: {
                or:
                    [
                        { name: { 'contains': query } },
                        { email: { 'contains': query } }
                    ]
            },
            limit: 10,
            sort: 'name ASC',
            select: ['name', 'email']
        };

        let metaData = {
            makeLikeModifierCaseInsensitive: true
        }


        // fetch users until none left or length of 10 is reached
        let usersToReturn = [];
        let lastUserFetchCount = 10;
        let skip = 0;
        if (projectId) {
            if (isIn === 'true') {
                isIn = true
            } else {
                isIn = false
            }

            while (usersToReturn.length !== 10 && lastUserFetchCount !== 0) {
                let users = await User.find({ ...criteria, skip }).populate('projectsOwned').populate('projectsJoined').meta(metaData);


                for (let i = 0; i < users.length; i++) {
                    let currentUser = users[i];

                    currentUser.projectsJoined = currentUser.projectsJoined.map(doc => doc.id);
                    currentUser.projectsOwned = currentUser.projectsOwned.map(doc => doc.id);
                    currentUser.projects = [...currentUser.projectsJoined, ...currentUser.projectsOwned];

                    const { name, email, id } = currentUser;


                    if (isIn) {
                        if (currentUser.projects.includes(projectId)) {
                            usersToReturn.push({ name, email, id })
                        }
                    } else {
                        if (!currentUser.projects.includes(projectId)) {
                            usersToReturn.push({ name, email, id });
                        }
                    }
                }

                skip += users.length;
                lastUserFetchCount = users.length;
            }

            return res.json({
                results: usersToReturn
            })
        }


        let usersDefault = await User.find(criteria).meta(metaData);

        return res.json({ results: usersDefault })
    }

};

