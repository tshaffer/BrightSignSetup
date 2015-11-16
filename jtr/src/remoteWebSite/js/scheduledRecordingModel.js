/**
 * Created by tedshaffer on 11/14/15.
 */
define(['serverInterface'], function (ServerInterface) {

    console.log("creating scheduledRecordingModel module");

    var scheduledRecordingModel = Backbone.Model.extend({

        ServerInterface: ServerInterface,

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
            //options.url = "http://10.1.0.241:8080/getEpg";
            //options.url = "http://192.168.2.8:8080/getEpg";
            options.url = this.ServerInterface.getBaseUrl() + "scheduledRecording";
            Backbone.sync(method, model, options);
        },
    });
    return scheduledRecordingModel;
});
