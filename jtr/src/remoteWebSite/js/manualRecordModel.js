/**
 * Created by tedshaffer on 10/27/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating ManualRecordModel module");

    var ManualRecordModel = Backbone.Model.extend({

        serverInterface: serverInterface,

        urlRoot : '/manualRecording',

        defaults: {
            title: '',
            duration: '',
            channel: '',
            dateTime: '',
            inputSource: 'tuner',
            segmentRecordings: 0,
            scheduledSeriesRecordingId: -1,
            startTimeOffset: 0,
            stopTimeOffset: 0
        },

        // doesn't work - error message is:
        // XMLHttpRequest cannot load http://192.168.2.8:8080/manualRecording. Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:63342' is therefore not allowed access. The response had HTTP status code 404.
        //sync: function(method, model, options) {
        //    options = options || {};
        //    //options.url = "http://10.1.0.241:8080/getEpg";
        //    //options.url = "http://192.168.2.8:8080/getEpg";
        //    options.url = this.serverInterface.getBaseUrl() + "manualRecording";
        //    Backbone.sync(method, model, options);
        //},

        //save: function(attributes, options) {
        //    debugger;
        //}
        //sync: function (method, model, options) {
        //    //debugger;
        //}

    //GET  /books/ .... collection.fetch();
    //POST /books/ .... collection.create();
    //GET  /books/1 ... model.fetch();
    //PUT  /books/1 ... model.save();
    //DEL  /books/1 ... model.destroy();

    //create → POST   /collection
    //read → GET   /collection[/id]
    //update → PUT   /collection/id
    //patch → PATCH   /collection/id
    //delete → DELETE   /collection/id

    });
    return ManualRecordModel;
});
