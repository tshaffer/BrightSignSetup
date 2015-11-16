/**
 * Created by tedshaffer on 11/13/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating SettingsModel module");

    var SettingsModel = Backbone.Model.extend({

        serverInterface: serverInterface,

        urlRoot : '/getSettings',

        defaults: {
            RecordingBitRate: 6,
            SegmentRecordings: 0
        },

        sync: function(method, model, options) {
            options = options || {};
            options.url = this.serverInterface.getBaseUrl() + "getSettings";
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
                        resolve();
                    }
                });
            });
        },

        getRecordingBitRate: function() {
            return this.get("RecordingBitRate");
        },

        getSegmentRecordings: function() {
            return this.get("SegmentRecordings");
        }
    });

    return SettingsModel;
});
