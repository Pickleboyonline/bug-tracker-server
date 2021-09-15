const jwt = require('jsonwebtoken');
// const User = require('../models/User');
const KEY = 'fbdahjsbf@%&@#!disa213g129b12fdas';

module.exports = {


  friendlyName: 'Authentication',


  description: 'Authentication something.',


  inputs: {
    req: {
      type: 'ref'
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

    noTokenProvided: {
      description: 'No token given',
    }
  },


  fn: async function ({ req }, exits) {
    // TODO
    let token = req.headers['x-auth-token'];

    if (!token) throw new Error('noTokenProvided');

    // Verify token
    // let payload;
    let payload
    try {
      payload = await (new Promise((res, rej) => {
        try {
          let result = jwt.verify(token, KEY)
          res(result)
        } catch (e) {
          rej(e)
        }
      }));
    } catch (e) {
      throw new Error('Token invalid')
    }


    if (payload) {
      let user = await User.findOne({
        id: payload.id
      });

      if (!user) throw new Error('user not found');
      if (user.passLastModified > payload.ait) throw new Error('password has been reset')

      return exits.success(user);
    } else {
      throw new Error('Token not valid')
    }



  }


};

