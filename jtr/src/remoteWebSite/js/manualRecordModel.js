/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordModel = Backbone.Model.extend({

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
        //save: function(attributes, options) {
        //    debugger;
        //}
        sync: function (method, model, options) {
            debugger;
        }

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
    return manualRecordModel;
});
