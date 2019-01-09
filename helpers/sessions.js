const expressSession = require("express-session");
const fs = require('fs');
const path = require('path');
const dbHelper = require('./database.js');
const thisFilename = 'sessions.js';

// NOTE: might have set proxy for sessions to work as well as to get correctly get the remote address
module.exports.initSession = function() {

    var sessionOpts = {
        secret: process.env.SESSION_SECRET,
        cookie: {secure: false},
        resave: false, // TODO: docs says says that should check if chosen store has 'touch' method, if not then set to true
        saveUninitialized: true,
    }
    if (process.env.NODE_ENV == "production") {
        // TODO: set up https / ssl certificate
        // set secure to true on production
        session_opts.cookie.secure = true;
    }
    return expressSession(sessionOpts);
}

module.exports.isAuthorized = async (email, sessionId) => {
    try {
        var result = await dbHelper.getUser(email);
        if (result.length == 1 && result[0].session_id == sessionId) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        throw new Error(thisFilename + ' => isAuthorized(), caught exception:\n' + e.stack);
    }
}
