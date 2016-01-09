var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var bonjour = require('bonjour')();
var app = express();

mongoose.connect('mongodb://ted:jtrTed@ds039125.mongolab.com:39125/jtr');

var Schema = mongoose.Schema;

var recordingSchema = new Schema({
    Duration: Number,
    FileName: String,
    HLSSegmentationComplete: Boolean,
    HLSUrl: String,
    JtrStorageDevice: String,
    LastViewedPosition: Number,
    path: String,
    RecordingId: Number,
    StartDateTime: Date,
    Title: String,
    TranscodeComplete: Boolean
});

var Recording = mongoose.model('Recording', recordingSchema);

var baseUrl = "http://192.168.0.105:8080/";

// synchronize recordings table between BigScreenJtr and mongodb

var bigScreenJtrRecordingsOnMongo = {};
var bigScreenJtrNativeRecordings = {};

// retrieve recordings on BigScreenJtr that are in the mongodb
Recording.find({'JtrStorageDevice': 'BigScreenJtr'}, function (err, recordings) {
    if (err) throw err;
    recordings.forEach(function (recording) {
        bigScreenJtrRecordingsOnMongo[recording.RecordingId] = recording;
    });

    // next, retrieve recordings from jtr
    var url = baseUrl + "getRecordings";
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recordingsResponse = JSON.parse(body);
            var freespace = recordingsResponse.freespace;
            var recordings = recordingsResponse.recordings;
            recordings.forEach(function (recording) {
                bigScreenJtrNativeRecordings[recording.RecordingId] = recording;
            });

            // remove any recordings that exist on mongodb but not jtr db from the mongo db
            for (var key in bigScreenJtrRecordingsOnMongo) {
                if (bigScreenJtrRecordingsOnMongo.hasOwnProperty(key)) {
                    if (!(key in bigScreenJtrNativeRecordings)) {
                        var recordingToRemoveFromMongo = bigScreenJtrRecordingsOnMongo[key];
                        console.log("Remove " + recordingToRemoveFromMongo.Title + " from mongo");
                        Recording.remove({_id: recordingToRemoveFromMongo._id}, function(err) {
                            if (err) throw err;
                        });
                    }
                }
            }

            // add any recordings that exist on jtr but not mongo db to the mongo db
            for (var key in bigScreenJtrNativeRecordings) {
                if (bigScreenJtrNativeRecordings.hasOwnProperty(key)) {
                    if (!(key in bigScreenJtrRecordingsOnMongo)) {
                        var recording = bigScreenJtrNativeRecordings[key];

                        console.log("Add " + recording.Title + " to mongo");

                        var recordingForDB = Recording({
                            Duration: recording.Duration,
                            FileName: recording.FileName,
                            HLSSegmentationComplete: recording.HLSSegmentationComplete === 1 ? true : false,
                            HLSUrl: recording.HLSUrl,
                            JtrStorageDevice: "BigScreenJtr",
                            LastViewedPosition: recording.LastViewedPosition,
                            path: recording.path,
                            RecordingId: recording.RecordingId,
                            StartDateTime: recording.StartDateTime,
                            Title: recording.Title,
                            TranscodeComplete: recording.TranscodeComplete === 1 ? true : false
                        });

                        recordingForDB.save(function (err) {
                            if (err) throw err;
                            console.log("recording " + recordingForDB.Title + " saved in db");
                        });
                    }
                }
            }

            console.log("done for now");

        }
    });
})

app.get('/', function(req, res) {
    res.send('<html><head></head><body><h1>Hello world!</h1></body></html>');
});

app.get('/getRecordings', function(req, res) {
    console.log("getRecordings invoked");
    res.set('Access-Control-Allow-Origin', '*');
    var url = baseUrl + "getRecordings";
    request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recordingsResponse = JSON.parse(body);
                res.send(recordingsResponse);
            }
        }
    );
});

// bonjour.find({ type: '_http._tcp.' }, function (service) {
bonjour.find({ type: 'http' }, function (service) {
//   console.log('Found an HTTP server:', service)
  if (service.host.startsWith('BrightSign')) {
      console.log("Found BrightSign model: " + service.txt.model);
      console.log("Serial number: " + service.txt.serialnumber);
      console.log("IP Address: " + service.txt.ipaddress);
  }
})


var port = process.env.PORT || 3000;
app.listen(port);