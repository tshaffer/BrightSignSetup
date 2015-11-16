/**
 * Created by tedshaffer on 11/14/15.
 */
define(['serverInterface', 'scheduledRecordingModel'], function (serverInterface, ScheduledRecordingModel) {

    console.log("creating ScheduledRecordingsModel module");

    var ScheduledRecordingsModel = Backbone.Collection.extend({

        urlRoot : '/scheduledRecordings',
        url : '/scheduledRecordings',
        model: ScheduledRecordingModel,

        //set: function(models, options) {
        //    console.log("ScheduledRecordingsModel.set invoked");
        //},

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/scheduledRecordings";
            //options.url = "http://192.168.2.8:8080/scheduledRecordings";
            options.url = serverInterface.getBaseUrl() + "scheduledRecordings";
            Backbone.sync(method, model, options);
        }
    });

    return ScheduledRecordingsModel;
});
