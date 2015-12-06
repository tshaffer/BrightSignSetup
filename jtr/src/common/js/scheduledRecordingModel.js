/**
 * Created by tedshaffer on 11/14/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating ScheduledRecordingModel module");

    var ScheduledRecordingModel = Backbone.Model.extend({

        urlRoot : '/scheduledRecording',

        defaults: {
            id: -1,
            dateTime: '',
            endDateTime: '',
            title: '',
            duration: 0,
            inputSource: '',
            channel: '',
            recordingBitRate: 6,
            segmentRecording: 0,
            scheduledSeriesRecordingId: -1,
            startTimeOffset: 0,
            stopTimeOffset: 0
        },

        sync: function(method, model, options) {
            options = options || {};
            options.url = serverInterface.getBaseUrl() + "scheduledRecording";
            Backbone.sync(method, model, options);
        },
    });
    return ScheduledRecordingModel;
});
