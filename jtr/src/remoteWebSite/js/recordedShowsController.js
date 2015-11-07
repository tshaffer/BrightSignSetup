/**
 * Created by tedshaffer on 10/31/15.
 */
//define(['recordedShowController, recordedShowsModel','recordedShowsRecordView'], function (RecordedShowController, RecordedShowsModel, RecordedShowsRecordView) {
define(['recordedShowsModel','recordedShowsView'], function (RecordedShowsModel, RecordedShowsView) {

    var recordedShowsController =
    {
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

                baseURL = "http://192.168.2.8:8080/";
                //baseURL = "http://10.1.0.241:8080/";
                var aUrl = baseURL + "browserCommand";
                var commandData = { "command": "playRecordedShow", "recordingId": recordingId };
                console.log(commandData);

                $.get(aUrl, commandData)
                    .done( function (result) {
                        console.log("browserCommand successfully sent");
                    })
                    .fail( function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        console.log("browserCommand failure");
                    })
                    .always( function () {
                        //alert("recording transmission finished");
                    });

                return false;
            });

            this.listenTo(this.recordedShowsView, "deleteSelectedShow", function(recordingId) {
                console.log("RecordedShowsController:: deleteSelectedShow event received, id = " + recordingId);

                baseURL = "http://192.168.2.8:8080/";
                //baseURL = "http://10.1.0.241:8080/";
                var aUrl = baseURL + "browserCommand";
                var commandData = { "command": "deleteRecordedShow", "recordingId": recordingId };
                console.log(commandData);

                $.get(aUrl, commandData)
                    .done( function (result) {
                        console.log("browserCommand successfully sent");
                        self.show();
                    })
                    .fail( function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        console.log("browserCommand failure");
                    })
                    .always( function () {
                        //alert("recording transmission finished");
                    });

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
        }
    };

    recordedShowsController.init();
    return recordedShowsController;
});
