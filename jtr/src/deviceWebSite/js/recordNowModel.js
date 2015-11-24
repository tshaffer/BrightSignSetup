/**
 * Created by tedshaffer on 11/18/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating RecordNowModel module");

    var RecordNowModel = Backbone.Model.extend({

        urlRoot : '/recordNow',

        defaults: {
            title: '',
            duration: '',
            channel: '',
            inputSource: 'tuner',
            segmentRecordings: 0,
            scheduledSeriesRecordingId: -1,
        },
    });
    return RecordNowModel;
});
