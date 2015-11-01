/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    var recordedShowModel = Backbone.Model.extend({

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
    return recordedShowModel;
});
