/**
 * Created by tedshaffer on 10/31/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating RecordedShowModel module");

    var RecordedShowModel = Backbone.Model.extend({

        defaults: {
            recordingId: -1,
            title: '',
            startDateTime: '',
            duration: 0,
            fileName: '',
            lastViewedPosition: 0,
            transcodeComplete: 0,
            hlsSegmentationComplete: 0,
            hlsUrl: '',
            programId: ""
        },

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
