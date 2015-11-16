/**
 * Created by tedshaffer on 10/31/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating RecordedShowModel module");

    var RecordedShowModel = Backbone.Model.extend({

        urlRoot : '/recordedShow',

        defaults: {
            recordingId: -1,
            title: '',
            startDateTime: '',
            duration: 0,
            fileName: '',
            lastViewedPosition: 0,
            transcodeComplete: 0,
            hlsSegmentationComplete: 0,
            hlsUrl: ''
        },

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/getEpg";
            //options.url = "http://192.168.2.8:8080/getEpg";
            options.url = serverInterface.getBaseUrl() + "recordedShow";
            Backbone.sync(method, model, options);
        },

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
    return RecordedShowModel;
});
