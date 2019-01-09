var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = (require("./helpers/logger.js")).logger;
var sessionHelper = require("./helpers/sessions.js");
var dbHelper = require('./helpers/database.js');
var propertyFieldsMap = require('./helpers/propertyFieldsMap').fieldsMap;
var csv = require('fast-csv');
var _ = require("underscore");
var cors = require('cors');


var app = express();

// middleware, TODO: move to middleware directory
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(sessionHelper.initSession());
app.use(cors());

function addVerificationFlags(properties, verifications) {
    function isPropertyInfoVerified(property, verifs) {
        if (!_.has(verifs, property.id)) {
            return false;
        }

        var propVerifs = verifications[property.id];
        for (var field in propertyFieldsMap) {
            var fieldVal = propertyFieldsMap[field];
            if (!fieldVal.editable || !fieldVal.active || fieldVal.group == 'Affordability Information') {
                continue;
            }

            if (!_.has(propVerifs, field)) {
                return false;
            }
            if (propVerifs[field] == 0) {
                return false;
            }
        }

        return true;
    }

    function isAffordabilityInfoVerified(property, verifs) {
        if (!_.has(verifs, property.id)) {
            return false;
        }

        var propVerifs = verifications[property.id];
        for (var field in propertyFieldsMap) {
            var fieldVal = propertyFieldsMap[field];
            if (!fieldVal.editable || !fieldVal.active || fieldVal.group != 'Affordability Information') {
                continue;
            }

            if (!_.has(propVerifs, field)) {
                return false;
            }
            if (propVerifs[field] == 0) {
                return false;
            }
        }

        return true;
    }

    function isBasicPropertyInfoVerified(property, verifs) {
        if (!_.has(verifs, property.id)) {
            return false;
        }

        var propVerifs = verifications[property.id];
        for (var field in propertyFieldsMap) {
            var fieldVal = propertyFieldsMap[field];
            if (!fieldVal.editable || !fieldVal.active || !fieldVal.tags || !_.contains(fieldVal.tags, 'Basic Property Info')) {
                continue;
            }

            if (!_.has(propVerifs, field)) {
                return false;
            }
            if (propVerifs[field] == 0) {
                return false;
            }
        }

        return true;

    }

    function isTenantCriteriaVerified(property, verifs) {
        if (!_.has(verifs, property.id)) {
            return false;
        }

        var propVerifs = verifications[property.id];
        for (var field in propertyFieldsMap) {
            var fieldVal = propertyFieldsMap[field];
            if (!fieldVal.editable || !fieldVal.active || !fieldVal.tags || !_.contains(fieldVal.tags, 'Tenant Criteria Info')) {
                continue;
            }

            if (!_.has(propVerifs, field)) {
                return false;
            }
            if (propVerifs[field] == 0) {
                return false;
            }
        }

        return true;
    }

    for (var p in properties) {
        var property = properties[p];
        if (isPropertyInfoVerified(property, verifications)) {
            properties[p].propertyInfoVerified = true;
        } else {
            properties[p].propertyInfoVerified = false;
        }
        if (isAffordabilityInfoVerified(property, verifications)) {
            properties[p].affordabilityInfoVerified = true;
        } else {
            properties[p].affordabilityInfoVerified = false;
        }
        if (isBasicPropertyInfoVerified(property, verifications)) {
            properties[p].basicPropertyInfoVerified = true;
        } else {
            properties[p].basicPropertyInfoVerified = false;
        }
        if (isTenantCriteriaVerified(property, verifications)) {
            properties[p].tenantCriteriaVerified = true;
        } else {
            properties[p].tenantCriteriaVerified = false;
        }
    }
    return properties;
}

app.get('/update_properties_list', async (req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }

        var result = await dbHelper.getUpdatePropertiesList();
        var verifications = await dbHelper.getAllPropertyVerifications();
        result = addVerificationFlags(result, verifications);
        return res.status(200).send({success: true, data: result});
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.options('*', cors());
app.get('/get_all_properties', async (req, res) => {
    function isCityAustin(city) {
        if (!city) {
            return false;
        }
        var tempCity = city.toLowerCase();
        if (tempCity.match(/.*austin.*/)) {
            return true;
        } else {
            return false;
        }
    }

    try {
        var result = await dbHelper.getAllProperties();
        var verifications = await dbHelper.getAllPropertyVerifications();
        result = addVerificationFlags(result, verifications);
        result = _.filter(result, function(property) {
            return property.basicPropertyInfoVerified;
        });
        return res.status(200).send({success: true, data: result});
    } catch (e) {
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/get_all_data', async(req, res) => {
    try {
        var result = await dbHelper.getAllPropertiesAllFields();
        return res.status(200).send({success: true, data: result});
    } catch (e) {
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/get_assigned_user', async(req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }
        var propertyId = req.query.propertyId;
        var assignedUser = await dbHelper.getPropertyAssignedUser(propertyId);
        return res.status(200).send({success: true, data: assignedUser});
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/unassign_user', async(req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }
        var propertyId = req.query.propertyId;
        await dbHelper.unassignUser(propertyId);
        return res.status(200).send({success: true});
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/assign_property_to_user', async(req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }
        var propertyId = req.query.propertyId;
        var result = await dbHelper.getUser(req.query.userEmail);
        await dbHelper.assign_property_to_user(propertyId, result[0].id);
        return res.status(200).send({success: true, assignedTo: req.query.userEmail});
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.post('/update_property', async(req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'});
        }
        // TODO: throw error if there is no property id
        var result = await dbHelper.getUser(req.query.userEmail);
        var user = result[0];
        dbHelper.updateData(req.body.updatedData, req.body.propertyId, user.id);
        return res.status(200).send({success: true});
    } catch(e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/property', async(req, res) => {
    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }
        var propertyId = req.query.propertyId;
        var result = await dbHelper.getProperty(propertyId);
        var assignedUser = await dbHelper.getPropertyAssignedUser(propertyId);
        var verifications = await dbHelper.getPropertyVerifications(propertyId);
        return res.status(200).send({success: true, data: result[0], fieldsMap: propertyFieldsMap, assignedUser: assignedUser, verifications: verifications});
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.post('/new_property', async(req, res) => {
    function hasRequiredInfo(req) {
        if (req.body.property_name && req.body.street_address && req.body.city && req.body.state && req.body.zipcode) {
            return true;
        } else {
            return false;
        }
    }

    try {
        if (!await sessionHelper.isAuthorized(req.query.userEmail, req.sessionID)) {
            return res.status(401).send({success: false, redirect: '/'})
        }
        if (hasRequiredInfo(req)) {
            var result = await dbHelper.createProperty(req.body.property_name, req.body.street_address, req.body.city, req.body.state, req.body.zipcode);
            return res.status(200).send({success: true, redirect: `/update_property/${result.insertId}`})
        } else {
            return res.status(500).send({success: false, message: 'All fields are required'});
        }
    } catch (e) {
        logger.log('error', e, {origin: 'server'});
        return res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.get('/*', (req, res) => {
    res.sendFile(__dirname + "/public/main.html");
});

app.post('/login', async (req, res) => {

    try {
        var email = req.body.email
        var pass = req.body.pass
        var result = await dbHelper.doesUserExist(email, pass);
        var user = result[0];
        if (user) {
            // set this session id in the user's table, and then for all the other pages (like update_properties) we need to check that the session is the same, and if it is, then we want to allow them, but if not, then we want to send back a redirect option, and then take them back to the login page to login
            await dbHelper.updateSessionId(user.id, req.sessionID);

            res.status(200).send({success: true});
        } else {
            res.status(200).send({success: false});
        }
    } catch(e) {
        logger.log('error', e, {origin: 'server'});
        res.status(500).send({success: false, error: e.stack.toString(), serverSideError: true});
    }
});

app.post('/log_event', (req, res) => {

    // logger defaults
    var level = "info";
    var message = null;
    var log = req.body;

    // add session id to metadata
    if (_.has(req, "sessionID")) {
        log.sid = req.sessionID;
    }

    if (_.has(log, "level")) {
        level = log.level;
        log = _.omit(log, "level");
    }

    if (_.has(log, "message")) {
        message = log.message;
        log = _.omit(log, "message");
    }

    logger.log(level, message, log);

    res.sendStatus(200);
});

function getPort() {
    if (process.env.NODE_ENV == 'PRODUCTION') {
        return 80;
    } else {
        console.log('Listening on port 3000')
        return 3000;
    }
}

app.listen(getPort(), () => {
    function logBuildType() {
        if (process.env.NODE_ENV == "PRODUCTION") {
            logger.info(
                "Build Type (NODE_ENV) is PRODUCTION",
                {
                    buildType: "PRODUCTION",
                    origin: 'server'
                }
            );
        } else if (process.env.NODE_ENV == "DEVELOPMENT") {
            logger.info(
                "Build Type (NODE_ENV)",
                {
                    buildType: "DEVELOPMENT",
                    origin: 'server'
                }
            );
        } else {
            logger.error(
                "Build Type (NODE_ENV) is UNKNOWN!",
                {
                    buildType: "UNKNOWN",
                    origin: 'server'
                }
            );
        }
    }
    //NOTE: do not log this during development, because we run node daemon and it continously restarts the app, it will continously log this - and we don't want to make the logs messy
    if (process.env.NODE_ENV == 'PRODUCTION') {
        logger.log("info", "App is listening on port 80...")
        logBuildType();
    }
});

