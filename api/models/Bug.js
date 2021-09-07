/**
 * Bug.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    title: { type: 'string', required: true },
    description: { type: 'string' },
    tags: { type: 'string' },
    dueDate: { type: 'number' },
    severity: { type: 'string' },
    reproducibility: { type: 'string' },
    catagory: { type: 'string' },
    plainTextDescription: { type: 'string' },
    status: { type: 'string', defaultsTo: 'open' },
    //totalAssignees: { type: 'number', defaultsTo: 0 },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    submitter: {
      model: 'user'
    },
    files: {
      collection: 'uploadedfile',
      via: 'bug'
    },
    assignedTo: {
      collection: 'user',
      via: 'assignedBugs'
    },
    project: {
      model: 'project',
      required: true
    },
    comments: {
      collection: 'comment',
      via: 'bug'
    }
  },

};

