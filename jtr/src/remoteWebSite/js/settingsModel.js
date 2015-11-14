/**
 * Created by tedshaffer on 11/13/15.
 */
define(function () {

    var settingsModel = Backbone.Model.extend({

        ServerInterface: null,

        setServerInterface: function(serverInterface) {
            this.ServerInterface = serverInterface;
        },

        urlRoot : '/getSettings',

        defaults: {
            RecordingBitRate: 6,
            SegmentRecordings: 0
        },

        sync: function(method, model, options) {
            options = options || {};
            options.url = this.ServerInterface.getBaseUrl() + "getSettings";
            Backbone.sync(method, model, options);
        },

        init: function() {
        },

        retrieveSettings: function() {
            var self = this;

            return new Promise(function(resolve, reject) {

                self.fetch({
                    success: function (model, response, options) {
                        console.log("settings load was successful");
                        self.recordingBitRate = model.get("RecordingBitRate");
                        self.segmentRecordings = model.get("SegmentRecordings");
                        resolve();
                    }
                });
            });
        },

        getRecordingBitRate: function() {
            return this.recordingBitRate;
        },

        getSegmentRecordings: function() {
            return this.segmentRecordings;
        }
    });

    return settingsModel;
});
