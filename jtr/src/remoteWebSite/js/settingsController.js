/**
 * Created by tedshaffer on 11/13/15.
 */
define(['settingsModel'], function (SettingsModel) {

    var settingsController = {

        ServerInterface: null,

        setServerInterface: function(serverInterface) {
            this.settingsModel.setServerInterface(serverInterface);
        },

        settingsModel: null,

        init: function() {

            this.settingsModel = new SettingsModel({});
            this.settingsModel.init();
        },

        retrieveData: function() {
            // retrieve settings
            var self = this;
            var promise = this.settingsModel.retrieveSettings();
            // JOEL!! why isn't self correct in promise callback below?
            //promise.then(function() {
            //    debugger;
            //})
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
