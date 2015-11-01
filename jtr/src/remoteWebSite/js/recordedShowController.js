/**
 * Created by tedshaffer on 10/31/15.
 */
define(['recordedShowModel', 'recordedShowView'], function (RecordedShowModel, RecordedShowView) {

    var recordedShowController = {
        p1: 69,

        recordedShowModel: null,
        recordedShowView: null,

        init: function() {

            var recordedShowView = new RecordedShowView(

            );

            _.extend(this, Backbone.Events);
        }
    };

    recordedShowController.init();
    return recordedShowController;
});
