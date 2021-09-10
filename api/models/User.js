/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    name: {
      type: 'string',
      required: true
    },
    password: {
      type: 'string',
      required: true
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    passLastModified: {
      type: 'number',
      required: true
    },
    theme: {
      type: 'string'
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    assignedBugs: {
      collection: 'bug',
      via: 'assignedTo'
    },
    bugs: {
      collection: 'bug',
      via: 'submitter'
    },
    files: {
      collection: 'uploadedfile',
      via: 'uploader'
    },
    projectsOwned: {
      collection: 'project',
      via: 'owner'
    },
    projectsJoined: {
      collection: 'project',
      via: 'members'
    },
    events: {
      collection: 'event',
      via: 'owner'
    },
    comments: {
      collection: 'comment',
      via: 'owner'
    },
    announcemnents: {
      collection: 'announcement',
      via: 'submitter'
    },
    roles: {
      collection: 'role',
      via: 'users'
    },
    notificationSettings: {
      collection: 'notificationsetting',
      via: 'user'
    },
    sentMessages: {
      collection: 'message',
      via: 'sender'
    },
    recievedMessages: {
      collection: 'message',
      via: 'reciever'
    },
    notifications: {
      collection: 'notification',
      via: 'reciepent'
    }
  },
  schema: true
};

