var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var app = express();

//mongoose.connect('mongodb://ted:jtrTed@ds039125.mongolab.com:39125/jtr');

//var john = Person({
//  firstname: 'John',
//  lastname: 'Doe',
//  address: '555 Main St.'
//});
//
//// save the user
//john.save(function(err) {
//  if (err) throw err;
//
//  console.log('person saved!');
//});

var Schema = mongoose.Schema;

var recordingSchema = new Schema({
    Duration: Number,
    FileName: String,
    HLSSegmentationComplete: Boolean,
    HLSUrl: String,
    LastViewedPosition: Number,
    path: String,
    RecordingId: Number,
    StartDateTime: Date,
    Title: String,
    TranscodeComplete: Boolean  
});

var Recording = mongoose.model('Recording', recordingSchema);

var baseUrl = "http://192.168.0.101:8080/";
var url = baseUrl + "getRecordings";
request(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    // console.log(body);
    var recordingsResponse = JSON.parse(body);
    var freespace = recordingsResponse.freespace;
    var recordings = recordingsResponse.recordings;
    recordings.forEach( function(recording) {
       var recordingForDB =  Recording({
          Duration: recording.Duration,
          FileName: recording.FileName,
          HLSSegmentationComplete: recording.HLSSegmentationComplete === 1 ? true : false,
          HLSUrl: recording.HLSUrl,
          LastViewedPosition: recording.LastViewedPosition,
          path: recording.path,
          RecordingId: recording.RecordingId,
          StartDateTime: recording.StartDateTime,
          Title: recording.Title,
          TranscodeComplete: recording.TranscodeComplete === 1 ? true : false
       });
       
       console.log(recordingForDB);
    });
  }
});

//var port = process.env.PORT || 3000;
//
//app.listen(port);