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
