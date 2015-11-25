/**
 * Created by tedshaffer on 10/31/15.
 */
//define(['recordedShowController, recordedShowsModel','recordedShowsRecordView'], function (RecordedShowController, RecordedShowsModel, RecordedShowsRecordView) {
define(['serverInterface','recordedShowsModel','recordedShowsView'], function (serverInterface, RecordedShowsModel, RecordedShowsView) {

    console.log("creating recordedShowsController module");

    var recordedShowsController =
    {
        appController: null,

        recordedShowsModel: null,
        recordedShowsView: null,

        init: function() {

            this.recordedShowsModel = new RecordedShowsModel({
                model: null
            });

            this.recordedShowsView = new RecordedShowsView({
                el: $("#recordedShowsTableBody"),
                model: this.recordedShowsModel
            });

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.recordedShowsView, "playSelectedShow", function(recordingId) {
                console.log("RecordedShowsController:: playSelectedShow event received, id = " + recordingId);

                var commandData = { "command": "playRecordedShow", "recordingId": recordingId };
                var promise = serverInterface.browserCommand(commandData);
                promise.then(function() {
                    console.log("browserCommand successfully sent");
                })

                return false;
            });

            this.listenTo(this.recordedShowsView, "deleteSelectedShow", function(recordingId) {
                console.log("RecordedShowsController:: deleteSelectedShow event received, id = " + recordingId);

                var commandData = { "command": "deleteRecordedShow", "recordingId": recordingId };
                var promise = serverInterface.browserCommand(commandData);
                promise.then(function() {
                    console.log("browserCommand successfully sent");
                    self.show();
                })

                return false;
            });

            this.listenTo(this.recordedShowsView, "invokeHome", function() {
                console.log("recordedShowsView:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });


        },

        show: function() {
            console.log("recordedShowsController:show() invoked");

            var self = this;

            this.recordedShowsModel.fetch({
                success: function () {
                    console.log("JSON file load was successful", self.recordedShowsModel);
                    console.log("number of recorded shows = " + self.recordedShowsModel.models.length.toString());
                    self.recordedShowsView.show();
                },
                error: function () {
                    console.log('There was some error in loading and processing the JSON file');
                }
            });
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(targetPage, remoteCommand) {
                if (targetPage == "recordedShowsPage") {
                    console.log("recordedShowsController: remoteCommand received.");
                    this.recordedShowsView.executeRemoteCommand(remoteCommand);
                }
            });
        }

    };

    recordedShowsController.init();
    return recordedShowsController;
});
