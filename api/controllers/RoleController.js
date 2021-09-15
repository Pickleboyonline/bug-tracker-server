/**
 * RoleController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


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

        let { projectId, title, permissions, users, color } = req.body;

        if (color === '') color = undefined;


        // Validate permissions
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: projectId,
                permission: PERMISSIONS.MODIFY_GENERAL
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.notFound()
        }


        // Validate permissions
        let permissionsArray = permissions.split(',');

        for (let i = 0; i < permissionsArray.length; i++) {
            let isValidPermission = false;

            for (let j = 0; j < PERMISSIONS_ARRAY.length; j++) {
                if (permissionsArray[i] === PERMISSIONS_ARRAY[j] || permissionsArray[i] === '') {
                    isValidPermission = true;
                    break;
                }
            }

            if (!isValidPermission) {
                return res.badRequest("Permissions are invalid: " + permissionsArray[i])
            }

        }


        // ensure only one role exists for a given project with "title"
        let existingRole = await Role.findOne({ project: projectId, title });
        if (existingRole) return res.badRequest("Role already exists for this project");

        // create role
        let role = await Role.create({ project: projectId, title, permissions, color }).fetch()

        // add initial users if given
        let userIds;
        if (users) {
            userIds = users.split(',')
        } else {
            userIds = [];
        }
        await Role.addToCollection(role.id, 'users', userIds);
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

        let roles = await Role.find({ project: projectId }).populate('users', { select: ['name', 'email'] });

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
    },

    delete: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        const { roleId } = req.params;

        let role = await Role.findOne({ id: roleId })
        if (!role) return res.notFound("Role does not exist")


        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: role.project,
                permission: PERMISSIONS.MODIFY_GENERAL
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.notFound()
        }

        await Role.destroyOne({ id: roleId })



        return res.json({
            message: 'Role was removed',
            role
        })
    },


    update: async (req, res) => {
        var user;
        try {
            user = await sails.helpers.authentication(req);
        } catch (e) {
            sails.log(e)
            return res.forbidden()
        }

        let { roleId, title, permissions, users, color } = req.body;

        // Validate permissions
        let permissionsArray = permissions.split(',');

        for (let i = 0; i < permissionsArray.length; i++) {
            let isValidPermission = false;

            for (let j = 0; j < PERMISSIONS_ARRAY.length; j++) {
                if (permissionsArray[i] === PERMISSIONS_ARRAY[j] || permissionsArray[i] === '') {
                    isValidPermission = true;
                    break;
                }
            }

            if (!isValidPermission) {
                return res.badRequest("Permissions are invalid: " + permissionsArray[i])
            }

        }

        // ensure role exists
        let existingRole = await Role.findOne({ id: roleId }).populate('users');
        if (!existingRole) return res.badRequest("Role does not exist for this project");
        if (color === '') {
            color = undefined
        }

        // Ensure user is authorized
        try {
            let isAuthed = await sails.helpers.isAuthed.with({
                userId: user.id,
                projectId: existingRole.project,
                permission: PERMISSIONS.MODIFY_GENERAL
            });
            if (!isAuthed) {
                // sails.log("FORBIDDEn")
                res.status(403);
                return res.send("Forbidden: you do not have the necessary permissions")
            }

        } catch (e) {
            return res.notFound()
        }

        //update permissions and title
        await Role.updateOne({ id: existingRole.id }).set({
            permissions, title, color
        })

        // remove existing roles 
        let usersToAdd = [];
        let existingUsers = existingRole.users.map((item) => item.id);
        let updateUsers = users.split(',');

        // purge '' records
        for (let i = 0; i < updateUsers.length; i++) {
            if (updateUsers[i] === '') {
                updateUsers.splice(i, 1)
            }
        }

        for (let i = 0; i < updateUsers.length; i++) {
            let alreadyInCollection = false;

            for (let j = 0; j < existingUsers.length; j++) {
                if (updateUsers[i] === existingUsers[j]) {
                    alreadyInCollection = true;
                    existingUsers.splice(j, 1);
                    j--;
                }
            }
            if (!alreadyInCollection) {
                usersToAdd.push(updateUsers[i])
            }
        }


        await Role.addToCollection(existingRole.id, 'users', usersToAdd);
        await Role.removeFromCollection(existingRole.id, 'users', existingUsers)



        return res.json({
            message: 'Role was updated'
        })
    },

};

