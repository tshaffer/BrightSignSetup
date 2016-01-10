/**
 * Created by tedshaffer on 1/9/16.
 */
var request = require('request');

// FIXME - move to mongoController?
function getMongoDBRecordings(Recording) {

    return new Promise(function(resolve, reject) {

        var dbRecordings = {};

        Recording.find({'JtrStorageDevice': 'BigScreenJtr'}, function (err, recordings) {
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

        Recording.find({'JtrStorageDevice': 'BigScreenJtr'}, function (err, recordings) {
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

module.exports = {
    getMongoDBRecordings : getMongoDBRecordings,
    getMongoDBRecordingsList: getMongoDBRecordingsList,
    getJtrRecordings: getJtrRecordings,
    getJtrRecordingsList: getJtrRecordingsList,
}
