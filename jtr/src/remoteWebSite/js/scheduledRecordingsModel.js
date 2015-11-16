/**
 * Created by tedshaffer on 11/14/15.
 */
define(['serverInterface', 'scheduledRecordingModel'], function (ServerInterface, ScheduledRecordingModel) {

    console.log("creating ScheduledRecordingsModel module");

    var ScheduledRecordingsModel = Backbone.Collection.extend({

        ServerInterface: ServerInterface,

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
            options.url = this.ServerInterface.getBaseUrl() + "scheduledRecordings";
            Backbone.sync(method, model, options);
        }
    });

    return ScheduledRecordingsModel;
});
