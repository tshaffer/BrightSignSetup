/**
 * Created by tedshaffer on 11/14/15.
 */
define(['scheduledRecordingsModel','scheduledRecordingsView'], function (ScheduledRecordingsModel, ScheduledRecordingsView) {

    var scheduledRecordingsController =
    {
        scheduledRecordingsModel: null,
        scheduledRecordingsView: null,

        ServerInterface: null,

        setServerInterface: function(serverInterface) {
            this.ServerInterface = serverInterface;
            this.scheduledRecordingsModel.setServerInterface(serverInterface);
        },

        init: function() {

            this.scheduledRecordingsModel = new ScheduledRecordingsModel({
                model: null
            });

            this.scheduledRecordingsView = new ScheduledRecordingsView({
                el: $("#scheduledRecordingsTableBody"),
                model: this.scheduledRecordingsModel
            });

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.scheduledRecordingsView, "deleteScheduledRecording", function(scheduledRecordingId) {
                console.log("ScheduledRecordingsController:: deleteScheduledRecording event received, id = " + scheduledRecordingId);

                var promise = self.ServerInterface.deleteScheduledRecording(scheduledRecordingId);
                promise.then(function() {
                    console.log("deleteScheduledRecording successfully sent");
                    self.show();
                })

                return false;
            });

            this.listenTo(this.scheduledRecordingsView, "stopActiveRecording", function(scheduledRecordingId) {
                console.log("ScheduledRecordingsController:: stopActiveRecording event received, id = " + scheduledRecordingId);

                var promise = self.ServerInterface.stopActiveRecording(scheduledRecordingId);
                promise.then(function() {
                    console.log("stopActiveRecording successfully sent");
                    self.show();
                })

                return false;
            });
        },

        show: function() {
            console.log("scheduledRecordingsController:show() invoked");

            var self = this;

            var currentDateTimeIso = new Date().toISOString();
            var currentDateTime = {"currentDateTime": currentDateTimeIso};

            this.scheduledRecordingsModel.fetch({
                data: $.param({currentDateTime: currentDateTimeIso}),
                success: function (model, response, options) {
                    console.log("JSON file load was successful", self.scheduledRecordingsModel);
                    console.log("number of scheduled recordings = " + self.scheduledRecordingsModel.models.length.toString());
                    self.scheduledRecordingsView.show();
                },
                error: function () {
                    console.log('There was some error in loading and processing the JSON file');
                }
            });
        },

        setStationsModel: function(stationsModel) {
            this.scheduledRecordingsView.setStationsModel(stationsModel);
        }
    };

    scheduledRecordingsController.init();
    return scheduledRecordingsController;
});
