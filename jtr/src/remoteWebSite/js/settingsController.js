/**
 * Created by tedshaffer on 11/13/15.
 */
define(['settingsModel'], function (SettingsModel) {

    console.log("creating settingsController module");

    var settingsController = {

        settingsModel: SettingsModel,

        init: function() {

            this.settingsModel = new SettingsModel({});
            this.settingsModel.init();
        },

        retrieveData: function() {
            // retrieve settings
            var self = this;
            var promise = this.settingsModel.retrieveSettings();
            promise.then(function() {
                var recordingBitRate = self.settingsModel.getRecordingBitRate();
                var segmentRecordings = self.settingsModel.getSegmentRecordings();
            })
        },

        getSettingsModel: function() {
            return this.settingsModel;
        }
    };

    settingsController.init();
    return settingsController;
});
