var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var bonjour = require('bonjour')();
var app = express();

var deviceController = require('./controllers/deviceController');

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
    TranscodeComplete: Boolean,
    OnJtrConnectServer: Boolean,
    JtrOwner: String,
    JtrConnectPath: String
});

var Recording = mongoose.model('Recording', recordingSchema);

//var baseUrl = "http://192.168.0.105:8080/";


// get the recordings table from Mongo.
// FIXME - when showing recordings, only show the ones that are either on the jtrConnect server or on a jtr that has been connected.
// FIXME - or show the ones that are only on a non-connected JTR in a special color??
var recordingsOnMongo = {};
var dbRecordingsPromise = deviceController.getMongoDBRecordings(Recording);
dbRecordingsPromise.then(function(dbRecordings) {
    recordingsOnMongo = dbRecordings;

    // wait until recordings are retrieved from mongo before starting discovery service
    bonjour.find({ type: 'http' }, function(service) {
        bonjourServiceFound(service);
    })

});

// synchronize recordings table between BigScreenJtr and mongodb
//var recordingsOnMongo = {};
//var dbRecordingsPromise = deviceController.getMongoDBRecordings(Recording);
//dbRecordingsPromise.then(function(dbRecordings) {
//    recordingsOnMongo = dbRecordings;
//});
//
//var bigScreenJtrNativeRecordings = {};
//var jtrRecordingsPromise = deviceController.getJtrRecordings(baseUrl);
//
//// FIXME - ultimately can't do this as a JTR might not respond
//Promise.all([dbRecordingsPromise, jtrRecordingsPromise]).then(function (results) {
//
//    recordingsOnMongo = results[0];
//    bigScreenJtrNativeRecordings = results[1];
//
//    // remove any recordings that exist on mongodb but not jtr db from the mongo db
//    for (var key in recordingsOnMongo) {
//        if (recordingsOnMongo.hasOwnProperty(key)) {
//            if (!(key in bigScreenJtrNativeRecordings)) {
//                var recordingToRemoveFromMongo = recordingsOnMongo[key];
//                console.log("Remove " + recordingToRemoveFromMongo.Title + " from mongo");
//                Recording.remove({_id: recordingToRemoveFromMongo._id}, function (err) {
//                    if (err) throw err;
//                });
//            }
//        }
//    }
//
//    // add any recordings that exist on jtr but not mongo db to the mongo db
//    for (var key in bigScreenJtrNativeRecordings) {
//        if (bigScreenJtrNativeRecordings.hasOwnProperty(key)) {
//            if (!(key in recordingsOnMongo)) {
//                var recording = bigScreenJtrNativeRecordings[key];
//
//                console.log("Add " + recording.Title + " to mongo");
//
//                var recordingForDB = Recording({
//                    Duration: recording.Duration,
//                    FileName: recording.FileName,
//                    HLSSegmentationComplete: recording.HLSSegmentationComplete === 1 ? true : false,
//                    HLSUrl: recording.HLSUrl,
//                    JtrStorageDevice: "BigScreenJtr",
//                    LastViewedPosition: recording.LastViewedPosition,
//                    path: recording.path,
//                    RecordingId: recording.RecordingId,
//                    StartDateTime: recording.StartDateTime,
//                    Title: recording.Title,
//                    TranscodeComplete: recording.TranscodeComplete === 1 ? true : false
//                });
//
//                recordingForDB.save(function (err) {
//                    if (err) throw err;
//                    console.log("recording " + recordingForDB.Title + " saved in db");
//                });
//            }
//        }
//    }
//
//    console.log("done for now");
//});

app.get('/', function(req, res) {
    res.send('<html><head></head><body><h1>Hello jtr!</h1></body></html>');
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

function bonjourServiceFound(service) {
  if (service.host.startsWith('BrightSign')) {
      console.log("Found BrightSign model: " + service.txt.model);
      console.log("Serial number: " + service.txt.serialnumber);
      console.log("IP Address: " + service.txt.ipaddress);
      console.log("Friendly name: " + service.txt.friendlyname)

      var deviceUrl = "http://" + service.txt.ipaddress + ":" + service.port.toString() + "/";
      var jtrName = service.txt.friendlyname;

      // retrieve the recordings for this jtr
      // FIXME - only retrieve this the first time the device connects
      // FIXME - need to figure out how to update this when the device adds / removes recordings

      console.log("retrieve recordings from: " + service.txt.friendlyname);
      var jtrRecordingsPromise = deviceController.getJtrRecordings(deviceUrl);
      jtrRecordingsPromise.then(function(results) {
          var jtrRecordings = results;

          // synchronize these recordings with the existing mongo recordings
          // FIXME - using the recordingId as the unique identifier won't work because recordingId's are not guaranteed to be unique across jtr's

          // remove any recordings that exist on mongodb for this jtr but are not in the recordings just retrieved
          for (var key in recordingsOnMongo) {
              if (recordingsOnMongo.hasOwnProperty(key)) {
                  // before checking the mongo recording, check to see if it's jtrOwner is the jtr that was just discovered
                  if (recordingsOnMongo[key].JtrOwner === jtrName) {
                      if (!(key in bigScreenJtrNativeRecordings)) {
                          var recordingToRemoveFromMongo = recordingsOnMongo[key];
                          console.log("Remove " + recordingToRemoveFromMongo.Title + " from mongo");
                          Recording.remove({_id: recordingToRemoveFromMongo._id}, function (err) {
                              if (err) throw err;
                          });
                      }
                  }
              }
          }

          // add any recordings from the discovered jtr that are not on the mongo db to the mongo db
          for (var key in jtrRecordings) {
              if (jtrRecordings.hasOwnProperty(key)) {
                  if (!(key in recordingsOnMongo)) {
                      var recording = jtrRecordings[key];

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
                          TranscodeComplete: recording.TranscodeComplete === 1 ? true : false,
                          OnJtrConnectServer: false,
                          JtrOwner: jtrName,
                          JtrConnectPath: ""
                      });

                      var recordingTitle = recordingForDB.Title;
                      recordingForDB.save(function (err) {
                          if (err) throw err;
                          console.log("recording " + recordingTitle + " saved in db");
                      });
                  }
              }
          }

          console.log("recordings synchronized between " + jtrName + " and mongoDB");
      });
  }
}


var port = process.env.PORT || 3000;
app.listen(port);