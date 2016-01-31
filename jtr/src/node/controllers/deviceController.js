/**
 * Created by tedshaffer on 1/9/16.
 */
var request = require('request');
var fs = require("fs");

// FIXME - put me elsewhere
function twoDigitFormat(val) {
    val = '' + val;
    if (val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}


// FIXME - move to epgController
var schedulesDirectToken;
var numDaysEpgData = 3;
var scheduleValidityByStationDate = {};     // schedule information for each station/date

function getSchedulesDirectToken() {

    return new Promise(function (resolve, reject) {

        var postData = {}

        postData.username = "jtrDev";
        postData.password = "3bacdc30b9598fb498dfefc00b2f2ad52150eef4";
        var postDataStr = JSON.stringify(postData);

        var url = "https://json.schedulesdirect.org/20141201/token";

        request.post({
            headers: {"User-Agent": "jtr"},
            url:     url,
            body:    postDataStr
        }, function(error, response, body){

            // FIXME check for error

            console.log(body);

            var data = JSON.parse(body);
            //schedulesDirectToken = data.token;

            resolve(data.token);
        });
    });
}


function retrieveEpgDataStep2() {

    // where should stations come from?
    var stations = [];

    var station = {};
    station.StationId = '19571';
    station.AtscMajor = 2;
    station.AtscMinor = 1;
    station.CommonName = 'KTVU';
    station.Name = 'KTVUDT (KTVU-DT)';
    stations.push(station);

    station = {};
    station.StationId = '19573';
    station.AtscMajor = 4;
    station.AtscMinor = 1;
    station.CommonName = 'KRON';
    station.Name = 'KRONDT (KRON-DT)';
    stations.push(station);

    var stationIds = [];
    var dates = [];

    // step 2
    // build initial scheduleValidityByStationDate. That is, add keys, set values to initial /  default settings
    // one entry for each station, date combination
    stations.forEach(function(station) {

        var startDate = new Date();

        for (i = 0; i < numDaysEpgData; i++) {
            var date = new Date(startDate);
            date.setDate(date.getDate() + i);
            var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());

            var stationDate = station.StationId + "-" + dateVal;

            var scheduleValidity = {};
            scheduleValidity.stationId = station.StationId;
            scheduleValidity.scheduleDate = dateVal;
            scheduleValidity.modifiedDate = "";
            scheduleValidity.md5 = "";
            scheduleValidity.status = "noData";
            scheduleValidityByStationDate[stationDate] = scheduleValidity;

            if (stationIds.length == 0) {
                dates.push(dateVal);
            }
        }

        stationIds.push(station.StationId);
    });

// FIXME - havent done any of this code yet
    
    // retrieve last fetched station schedules from db
    var url = baseURL + "getStationSchedulesForSingleDay";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
        .done(function (stationSchedulesForSingleDay) {
            //console.log("successful return from getStationSchedulesForSingleDay");

            // dump StationSchedulesForSingleDay table from db
            ////console.log(JSON.stringify(result, null, 4));

            // fill in scheduleValidityByStationDate with appropriate data from db
// JTR TODO
// change return value so that I dont have to use the nonsense on the next line.
            $.each(stationSchedulesForSingleDay, function (index, jtrStationScheduleForSingleDay) {
                var stationDate = jtrStationScheduleForSingleDay.StationId + "-" + jtrStationScheduleForSingleDay.ScheduleDate;

                // is the station/date retrieved from db in the initialized data structure?
                // JTR TODO - if not, perhaps that implies that the information can be removed from the database
                // it won't be for dates now in the past
                if (stationDate in scheduleValidityByStationDate) {
                    var scheduleValidity = scheduleValidityByStationDate[stationDate];
                    scheduleValidity.modifiedDate = jtrStationScheduleForSingleDay.ModifiedDate;
                    scheduleValidity.md5 = jtrStationScheduleForSingleDay.MD5;
                    scheduleValidity.status = "dataCurrent";
                }
            });

            // dump StationSchedulesForSingleDay as updated based on db data
            ////console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

            // fetch data from Schedules Direct that will indicate the last changed date/information for relevant station/dates.
            getSchedulesDirectScheduleModificationData(stationIds, dates, retrieveEpgDataStep3);
        })
        .fail(function () {
            alert("getStationSchedulesForSingleDay failure");
        })
        .always(function () {
            alert("getStationSchedulesForSingleDay complete");
        });

}


function getEpgData() {

    var promise = getSchedulesDirectToken();
    promise.then(function(token) {
        schedulesDirectToken = token;
        retrieveEpgDataStep2();
    });

}

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


function uploadRecordingFromJtr(url, targetPath) {

    return new Promise(function(resolve, reject) {

        var stream = request(url).pipe(fs.createWriteStream(targetPath));
        stream.on('finish', function() {
            console.log("stream write to " + targetPath + " complete.");
            resolve();
        });
        stream.on('error', function(error) {
            reject(error);
        })

    });
}


function downloadMP4ToJtr(url, fileName, recordingId) {

    return new Promise(function(resolve, reject) {

        //var postData = {}
        //
        //postData["Destination-Filename"] = "content/" + fileName;
        //postData["Friendly-Filename"] = fileName;
        //postData["DB-Id"] = recordingId;
        //var postDataStr = JSON.stringify(postData);

        var headers = {};
        headers["Destination-Filename"] = "content/" + fileName;
        headers["Friendly-Filename"] = fileName;
        headers["DB-Id"] = recordingId;

        request.post({
            headers: headers,
            url:     url,
            body:    ""
        }, function(error, response, body){
            if (error) {
                reject(error);
            }
            else {
                resolve();
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
    uploadRecordingFromJtr: uploadRecordingFromJtr,
    downloadMP4ToJtr: downloadMP4ToJtr,
    sendJtrConnectIP: sendJtrConnectIP,
    getEpgData: getEpgData
}
