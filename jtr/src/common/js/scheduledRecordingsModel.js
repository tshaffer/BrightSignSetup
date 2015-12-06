/**
 * Created by tedshaffer on 11/14/15.
 */
define(['serverInterface', 'scheduledRecordingModel'], function (serverInterface, ScheduledRecordingModel) {

    console.log("creating ScheduledRecordingsModel module");

    var ScheduledRecordingsModel = Backbone.Collection.extend({

        urlRoot : '/scheduledRecordings',
        url : '/scheduledRecordings',
        model: ScheduledRecordingModel,

        sync: function(method, model, options) {
            options = options || {};
            options.url = serverInterface.getBaseUrl() + "scheduledRecordings";
            Backbone.sync(method, model, options);
        }
    });

    return ScheduledRecordingsModel;
});
