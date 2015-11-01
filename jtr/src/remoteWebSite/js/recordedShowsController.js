/**
 * Created by tedshaffer on 10/31/15.
 */
define(['recordedShowController, recordedShowsModel','recordedShowsRecordView'], function (RecordedShowController, RecordedShowsModel, RecordedShowsRecordView) {

    var recordedShowsController =
    {
        recordedShowsModel: null,
        recordedShowsView: null,

        init: function() {

            this.recordedShowsModel = new RecordedShowsModel({
                model: null
            });

            this.recordedShowsView = new RecordedShowsView({
                el: $("#recordedShowsPage")
            });

            _.extend(this, Backbone.Events);


        }
    };

    recordedShowsController.init();
    return recordedShowsController;
});
