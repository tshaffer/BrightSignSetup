var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
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

var baseUrl = "http://192.168.0.101:8080/";

// synchronize recordings table between BigScreenJtr and mongodb

var bigScreenJtrRecordingsOnMongo = {};
var bigScreenJtrNativeRecordings = {};

// retrieve recordings on BigScreenJtr that are in the mongodb
Recording.find({ 'JtrStorageDevice': 'BigScreenJtr' }, function (err, recordings) {
    if (err) throw err;
    recordings.forEach(function(recording) {
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
            }
          }
        }

        // add any recordings that exist on jtr but not mongo db to the mongo db
        for (var key in bigScreenJtrNativeRecordings) {
          if (bigScreenJtrNativeRecordings.hasOwnProperty(key)) {
            if (!(key in bigScreenJtrRecordingsOnMongo)) {
              var recordingToAddToMongo = bigScreenJtrNativeRecordings[key];
              console.log("Add " + recordingToAddToMongo.Title + " to mongo");
            }
          }
        }

        console.log("done for now");

      }
    });
})

//var url = baseUrl + "getRecordings";
//request(url, function (error, response, body) {
//  if (!error && response.statusCode == 200) {
//    // console.log(body);
//    var recordingsResponse = JSON.parse(body);
//    var freespace = recordingsResponse.freespace;
//    var recordings = recordingsResponse.recordings;
//    recordings.forEach( function(recording) {
//       var recordingForDB =  Recording({
//          Duration: recording.Duration,
//          FileName: recording.FileName,
//          HLSSegmentationComplete: recording.HLSSegmentationComplete === 1 ? true : false,
//          HLSUrl: recording.HLSUrl,
//          JtrStorageDevice: "BigScreenJtr",
//          LastViewedPosition: recording.LastViewedPosition,
//          path: recording.path,
//          RecordingId: recording.RecordingId,
//          StartDateTime: recording.StartDateTime,
//          Title: recording.Title,
//          TranscodeComplete: recording.TranscodeComplete === 1 ? true : false
//       });
//
//      recordingForDB.save(function(err) {
//        if (err) throw err;
//        console.log("recording " + recordingForDB.Title + " saved in db");
//      });
//    });
//  }
//});

//var port = process.env.PORT || 3000;
//
//app.listen(port);