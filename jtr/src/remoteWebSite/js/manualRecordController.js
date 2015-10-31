/**
 * Created by tedshaffer on 10/27/15.
 */
define(['manualRecordModel','manualRecordView'], function (ManualRecordModel, ManualRecordView) {

    var manualRecordController = {

        manualRecordModel: null,
        manualRecordView: null,

        init: function() {

            this.manualRecordModel = new ManualRecordModel({
                channel: '5'
            });

            this.manualRecordView = new ManualRecordView({
                el: $("#manualRecordPage"),
                model: this.manualRecordModel
            });

            _.extend(this, Backbone.Events);

            //this.listenTo(this.manualRecordView, "executeManualRecord", function() {
            //    console.log("ManualRecordController:: executeManualRecord event received");
            //    return false;
            //});
            this.listenTo(this.manualRecordView, "manualRecordModelUpdateComplete", function() {
                console.log("ManualRecordController:: manualRecordModelUpdateComplete event received");
                this.manualRecordModel.save();
                return false;
            });

        },

        show: function() {
            console.log("manualRecordController:show() invoked");
            //this.manualRecordView.render();
            this.manualRecordView.show();
        },

        pizza: "pizza"
    };

    manualRecordController.init();
    return manualRecordController;
});
