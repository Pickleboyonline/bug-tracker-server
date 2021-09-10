/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/
  'POST /user/signup': 'UserController.signup',
  'POST /user/login': 'UserController.login',
  'GET /user/search': 'UserController.search',


  'POST /project/join': 'ProjectController.join',
  'POST /project/create': 'ProjectController.create',
  'GET /project/find': 'ProjectController.find',
  'GET /project/all': 'ProjectController.all',
  'GET /project/users/:projectId': 'ProjectController.users',
  'PUT /project/:projectId': 'ProjectController.update',
  'DELETE /project/member': 'ProjectController.removeUser',
  'POST /project/member': 'ProjectController.inviteUser',
  'GET /project/stats/:projectId': 'ProjectController.getStats',

  'POST /bug/create': 'BugController.create',
  'GET /bug/all': 'BugController.all',
  'PUT /bug/:bugId': 'BugController.update',
  'GET /bug/assignee': 'BugController.searchAssignees',
  'POST /bug/assignee': 'BugController.addAssignee',
  'DELETE /bug/assignee': 'BugController.removeAssignee',

  'POST /icon/upload': 'UploadedImageController.upload',
  'GET /icon/:id': 'UploadedImageController.get',


  'POST /file': 'UploadedFileController.upload',
  'DELETE /file/:fileId': 'UploadedFileController.delete',
  'GET /file/:fileId': 'UploadedFileController.get',

  'GET /comment': 'CommentController.get',
  'POST /comment': 'CommentController.create',

  'POST /announcement': 'AnnouncementController.create',
  'GET /announcement': 'AnnouncementController.get',

  'POST /role': 'RoleController.create',
  'PUT /role': 'RoleController.update',
  'GET /role/all/:projectId': 'RoleController.all',
  'GET /role/:roleId': 'RoleController.find',
  'DELETE /role/:roleId': 'RoleController.delete',

  'GET /notification-setting/:projectId': 'NotificationSettingController.get',
  'PUT /notification-setting/:projectId': 'NotificationSettingController.update',

  'POST /invite': { action: 'invite' },

  'POST /message/:userId': 'MessageController.sendMessage',
  'GET /conversation/all': 'MessageController.getConversation',
  'GET /conversation/:conversationId': 'MessageController.getMessages',
  // 'DELETE /conversation/:conversationId': 'MessageController.sendMessage',
};
