/**
 * Created by tedshaffer on 11/13/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating SettingsModel module");

    var SettingsModel = Backbone.Model.extend({

        urlRoot: '/settings',

        defaults: {
            RecordingBitRate: 6,
            SegmentRecordings: 0
        },

        sync: function(method, model, options) {
            options = options || {};
            options.url = serverInterface.getBaseUrl() + "settings";
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

        setRecordingBitRate: function(recordingBitRate) {
            this.set('RecordingBitRate', recordingBitRate);
            this.save();
        },

        getSegmentRecordings: function() {
            return this.get("SegmentRecordings");
        },

        setSegmentRecordings: function(segmentRecordings) {
            this.set('SegmentRecordings', segmentRecordings)
            this.save();
        }
    });

    return {
        instance: null,

        getInstance: function(){
            if(this.instance === null){
                console.log("settingsModel instantiation");
                this.instance = new SettingsModel();
            }
            return this.instance;
        }
    };
});
