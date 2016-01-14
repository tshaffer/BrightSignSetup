/**
 * Created by tedshaffer on 1/9/16.
 */
var request = require('request');

// FIXME - move to mongoController?
function getMongoDBRecording(Recording, recording) {

    return new Promise(function(resolve, reject) {

        var dbRecordings = {};

        //Recording.find({'JtrStorageDevice': 'tigerJtr'}, function (err, recordings) {
        Recording.find(
            {
                'JtrStorageDevice': recording.JtrStorageDevice,
                'RecordingId': recording.RecordingId,
            },
            function (err, dbRecording) {
                if (err) {
                    reject();
                }
                resolve(dbRecording);
        });
    });
}


function getMongoDBRecordings(Recording) {

    return new Promise(function(resolve, reject) {

        var dbRecordings = {};

        //Recording.find({'JtrStorageDevice': 'tigerJtr'}, function (err, recordings) {
        Recording.find({}, function (err, recordings) {
            if (err) {
                reject();
            }
            recordings.forEach(function (recording) {
                dbRecordings[recording.RecordingId] = recording;
            });
            resolve(dbRecordings);
        });
    });
}

function getMongoDBRecordingsList(Recording) {

    return new Promise(function(resolve, reject) {

        var dbRecordings = [];

        // FIXME - why is it only searching for tigerJtr? Why doesn't it get all the recordings?
        //Recording.find({'JtrStorageDevice': 'tigerJtr'}, function (err, recordings) {
        Recording.find({}, function (err, recordings) {
            if (err) {
                reject();
            }
            recordings.forEach(function (recording) {
                dbRecordings.push(recording);
            });
            resolve(dbRecordings);
        });
    });
}

function getJtrRecordings(baseUrl) {

    return new Promise(function(resolve, reject) {

        var url = baseUrl + "getRecordings";
        var jtrRecordings = {};

        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recordingsResponse = JSON.parse(body);
                var freespace = recordingsResponse.freespace;
                var recordings = recordingsResponse.recordings;
                recordings.forEach(function (recording) {
                    jtrRecordings[recording.RecordingId] = recording;
                });
                resolve(jtrRecordings);
            }
            else {
                reject();
            }
        });
    });
}

function getJtrRecordingsList(baseUrl) {

    return new Promise(function(resolve, reject) {

        var url = baseUrl + "getRecordings";
        var jtrRecordings = [];

        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recordingsResponse = JSON.parse(body);
                var freespace = recordingsResponse.freespace;
                var recordings = recordingsResponse.recordings;
                recordings.forEach(function (recording) {
                    jtrRecordings.push(recording);
                });
                resolve(jtrRecordings);
            }
            else {
                reject();
            }
        });
    });
}

function sendJtrConnectIP(baseUrl, jtrConnectIP) {

    return new Promise(function(resolve, reject) {

        var url = baseUrl + "jtrConnectIP";

        var params = { jtrConnectUrl: "http://" + jtrConnectIP + ":3000" };

        request( { url: url, qs: params }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                console.log("Get response: " + response.statusCode);
                resolve();
            }
            else {
                reject();
            }
        });
    });
}

module.exports = {
    getMongoDBRecording: getMongoDBRecording,
    getMongoDBRecordings : getMongoDBRecordings,
    getMongoDBRecordingsList: getMongoDBRecordingsList,
    getJtrRecordings: getJtrRecordings,
    getJtrRecordingsList: getJtrRecordingsList,
    sendJtrConnectIP: sendJtrConnectIP
}
