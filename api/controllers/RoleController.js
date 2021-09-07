/**
 * RoleController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Role = require("../models/Role");


const PERMISSIONS = {
    ALL: 'ALL',
    MODIFY_GENERAL: 'MODIFY_GENERAL',
    MODIFY_MEMBERS: 'MODIFY_MEMBERS',
    MODIFY_BUGS: 'MODIFY_BUGS',
    MODIFY_ANNOUNCEMENTS: 'MODIFY_ANNOUNCEMENTS'
}

const PERMISSIONS_ARRAY = [
    'ALL',
    'MODIFY_GENERAL',
    'MODIFY_MEMBERS',
    'MODIFY_BUGS',
    'MODIFY_ANNOUNCEMENTS'
]

module.exports = {
    create: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId, title, permissions, users } = req.body;

        // Validate permissions
        let areValidPermissions = true;
        let permissionsArray = permissions.split(',');
        let inValidPermission = '';

        for (let i = 0; i < permissionsArray.length; i++) {
            if (!areValidPermissions) break;

            for (let j = 0; j < PERMISSIONS_ARRAY.length; j++) {
                if (permissionsArray[i] !== PERMISSIONS_ARRAY[j]) {
                    areValidPermissions = false;
                    inValidPermission = permissionsArray[i];
                    break;
                }
            }
        }
        if (!areValidPermissions) return res.badRequest("Permissions are invalid: " + inValidPermission)

        // ensure only one role exists for a given project with "title"
        let existingRole = await Role.findOne({ project: projectId, title });
        if (existingRole) return res.badRequest("Role already exists for this project");

        // create role
        let role = await Role.create({ project: projectId, title, permissions })

        // add initial users if given
        await Role.addToCollection(role.id, 'users', users.split(','));
        role = await Role.findOne({ id: role.id }).populate('users', { select: ['name', 'email'] });

        return res.json({
            message: 'Role was created',
            role
        })
    },

    // get all roles for a specific project
    // /role/all/:projectId
    all: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { projectId } = req.params;

        let roles = await Role.find({ project: projectId });

        return res.json({
            roles
        })
    },

    // Get members of a specific role
    // /role/:roleId
    get: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { roleId } = req.params;

        let role = await Role.findOne({ id: roleId }).populate('users', { select: ['name', 'email'] });

        if (!role) return res.badRequest("Role does not exist");

        return res.json({
            role
        })
    }

};

