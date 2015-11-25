/**
 * Created by tedshaffer on 11/13/15.
 */
define(['settingsModel','settingsView'], function (SettingsModel,SettingsView) {

    console.log("creating settingsController module");

    var settingsController = {

        appController: null,

        settingsModel: null,
        settingsView: null,
        retrieveSettingsPromise: null,

        init: function() {

            this.settingsModel = SettingsModel.getInstance();
            this.settingsModel.init();

            this.settingsView = new SettingsView({
                el: $("#settingsPage"),
                model: this.settingsModel
            });

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.settingsView, "invokeHome", function() {
                console.log("settingsController:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });
        },

        show: function() {
            console.log("settingsController:show() invoked");

            var self = this;

            this.retrieveSettingsPromise.then(function() {
                self.settingsView.show();
            })
        },

        retrieveData: function() {
            // retrieve settings
            //var self = this;
            this.retrieveSettingsPromise = this.settingsModel.retrieveSettings();
            //this.retrieveSettingsPromise.then(function() {
            //    var recordingBitRate = self.settingsModel.getRecordingBitRate();
            //    var segmentRecordings = self.settingsModel.getSegmentRecordings();
            //})
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(targetPage, remoteCommand) {
                if (targetPage == "settingsPage") {
                    console.log("settingsController: remoteCommand received.");
                    this.settingsView.executeRemoteCommand(remoteCommand);
                }
            });
        }

    };

    settingsController.init();
    return settingsController;
});
