var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var bonjour = require('bonjour')();
var ip = require('ip');

var app = express();

//https://www.npmjs.com/package/ip
var jtrConnectIPAddress = ip.address();
console.log("jtrConnectIPAddress = " + jtrConnectIPAddress);

var deviceController = require('./controllers/deviceController');

//var FfmpegCommand = require('fluent-ffmpeg');
//var command = new FfmpegCommand();
var ffmpeg = require('fluent-ffmpeg');

ffmpeg.getAvailableFilters(function(err, filters) {
    console.log("available filters");
        
});

//var inputPath = __dirname + "/public/video/20160117T064800.ts";
//var outputPath = __dirname + "/public/video/20160117T064800.mp4";

var inputPath = __dirname + "/public/video/20160110T061102.ts";
var outputPath = __dirname + "/public/video/20160110T061102.mp4";

//ffmpeg -i GoodWife4.ts -bsf:a aac_adtstoasc -c copy GoodWife4.mp4

//ffmpeg(inputPath)
//    .output(outputPath)
//    .on('end', function() {
//        console.log('Finished processing');
//    })
//  .run();;

//ffmpeg(inputPath)
//     .outputOptions('-bsf:a aac_adtstoasc')
//     .output(outputPath)
//     .on('error', function(err) {
//         console.log('An error occurred: ' + err.message);
//     })
//     .on('start', function() {
//        console.log('processing started');
//     })
//     .on('end', function() {
//         console.log('Processing finished !');
//     })
//    .run();

inputPath = __dirname + "/public/video/in.ts";
outputPath = __dirname + "/public/video/out.mp4";

var execString = "ffmpeg -i " + inputPath + " -bsf:a aac_adtstoasc -c copy " + outputPath;

var exec = require('child_process').exec;
exec(execString, function callback(error, stdout, stderr){
    console.log("ffmpeg complete");
});

// ffmpeg(inputPath)
//     .on('error', function(err) {
//         console.log('An error occurred: ' + err.message);
//     })
//     .on('end', function() {
//         console.log('Processing finished !');
//     })
//     .save(outputPath);

//deviceController.getEpgData();
console.log(__dirname);

return;

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
    JtrConnectPath: String
});

var Recording = mongoose.model('Recording', recordingSchema);

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

app.use('/assets', express.static(__dirname + '/public'));

app.get('/addRecording', function(req, res) {
    console.log("addRecording invoked from jtr");

    // retrieve BrightSign date and generate Javascript date
    var dt = req.query.dateTime;
    var year = dt.substring(0,4);
    var month = dt.substring(4, 6);
    var day = dt.substring(6, 8);
    var hours = dt.substring(9, 11);
    var minutes = dt.substring(11, 13);
    var seconds = dt.substring(13, 15);
    var startDateTime = new Date(year, month, day, hours, minutes, seconds);

    var recordingForDB = Recording({
        Duration: Number(req.query.duration),
        FileName: req.query.fileName,
        HLSSegmentationComplete: false,
        HLSUrl: "",
        JtrStorageDevice: req.query.jtrName,
        LastViewedPosition: 0,
        // path: req.query.path,
        RecordingId: Number(req.query.recordingId),
        StartDateTime: startDateTime,
        Title: req.query.title,
        TranscodeComplete: false,
        OnJtrConnectServer: false,
        JtrConnectPath: ""
    });

    recordingForDB.save(function (err) {
        if (err) throw err;
        console.log("recording saved in db");

        res.set('Access-Control-Allow-Origin', '*');
        var response = {};
        res.send(response);
    });

});

app.get('/', function(req, res) {
    res.send('<html><head></head><body><h1>Hello jtr!</h1></body></html>');
});

app.get('/getRecordings', function(req, res) {
    console.log("getRecordings invoked");
    res.set('Access-Control-Allow-Origin', '*');

    var recordingsPromise = deviceController.getMongoDBRecordingsList(Recording);
    recordingsPromise.then(function(recordingsList) {
        var response = {};
        response.freeSpace = "";
        response.recordings = recordingsList;
        res.send(response);
    });
});

app.get('/updateRecording', function(req, res) {
    console.log("updateRecording invoked");

    var recordingForDB = Recording({
        Duration: Number(req.query.Duration),
        FileName: req.query.FileName,
        HLSSegmentationComplete: req.query.HLSSegmentationComplete === "1" ? true : false,
        HLSUrl: req.query.HLSUrl,
        JtrStorageDevice: req.query.JtrStorageDevice,
        LastViewedPosition: Number(req.query.LastViewedPosition),
        path: req.query.path,
        RecordingId: Number(req.query.RecordingId),
        StartDateTime: req.query.StartDateTime,
        Title: req.query.Title,
        TranscodeComplete: true,
        OnJtrConnectServer: true,
        JtrConnectPath: req.query.JtrConnectPath
    });

    var dbRecordingPromise = deviceController.getMongoDBRecording(Recording, recordingForDB);
    dbRecordingPromise.then(function(dbRecording) {
        recordingOnMongo = dbRecording;
        //recordingOnMongo.size = 'large';
        // the following is a strange way to do the update - see the link below for various ways to do updates
        // http://mongoosejs.com/docs/documents.html
        recordingForDB.save(function (err) {
            if (err) throw err;
        });
    });

    res.set('Access-Control-Allow-Origin', '*');
    var response = {};
    res.send(response);
});

function bonjourServiceFound(service) {
  console.log(service.host);
  if (service.host.startsWith('BrightSign')) {
      console.log("Found BrightSign model: " + service.txt.model);
      console.log("Serial number: " + service.txt.serialnumber);
      console.log("IP Address: " + service.txt.ipaddress);
      console.log("Friendly name: " + service.txt.friendlyname)

      var deviceUrl = "http://" + service.txt.ipaddress + ":" + service.port.toString() + "/";
      var jtrName = service.txt.friendlyname;

      if (jtrName === undefined || jtrName === "") {
          return;
      }

      // send jtrConnect's IP to jtr device
      var sendJtrConnectIPPromise = deviceController.sendJtrConnectIP(deviceUrl, jtrConnectIPAddress);
      sendJtrConnectIPPromise.then(function() {
          console.log("jtr ip address send to JTR successfully");
      });

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
                  // before checking the mongo recording, check to see if it's JtrStorageDevice is the jtr that was just discovered
                  if (recordingsOnMongo[key].JtrStorageDevice === jtrName) {
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
                          JtrStorageDevice: jtrName,
                          LastViewedPosition: recording.LastViewedPosition,
                          path: recording.path,
                          RecordingId: recording.RecordingId,
                          StartDateTime: recording.StartDateTime,
                          Title: recording.Title,
                          TranscodeComplete: recording.TranscodeComplete === 1 ? true : false,
                          OnJtrConnectServer: false,
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