
const PERMISSIONS_ARRAY = [
  'ALL',
  'MODIFY_GENERAL',
  'MODIFY_MEMBERS',
  'MODIFY_BUGS',
  'MODIFY_ANNOUNCEMENTS'
]

const PERMISSIONS = {
  ALL: 'ALL',
  MODIFY_GENERAL: 'MODIFY_GENERAL',
  MODIFY_MEMBERS: 'MODIFY_MEMBERS',
  MODIFY_BUGS: 'MODIFY_BUGS',
  MODIFY_ANNOUNCEMENTS: 'MODIFY_ANNOUNCEMENTS'
}
module.exports = {


  friendlyName: 'Is authed',


  description: 'Check if user is authenticated',


  inputs: {
    userId: {
      type: 'string',
      required: true
    },
    projectId: {
      type: 'string',
      required: true
    },
    permission: {
      type: 'string',
      required: true
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },
    projectNotFound: {
      description: 'ProjectNotFound'
    },
    userNotFound: {
      description: 'user not found'
    }
  },

  /**
  * Accepts userId, projectId, and requested permission
  * Checks users roles and associated permissions 
  */
  fn: async function (inputs, exits) {
    // TODO
    let { userId, projectId, permission } = inputs;

    let project = await Project.findOne({ id: projectId })

    if (!project) return 'projectNotFound';

    if (project.owner === userId) return exits.success(true);

    let user = await User.findOne({ id: userId }).populate('roles', {
      where: {
        or: [
          { project: projectId, permissions: { contains: 'ALL' } },
          { project: projectId, permissions: { contains: permission } }
        ]
      }
    });


    if (!user) return 'userNotFound';

    if (user.roles.length !== 0) return exits.success(true)

    return exits.success(false)
  }


};

