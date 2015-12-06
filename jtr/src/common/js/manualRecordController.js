/**
 * Created by tedshaffer on 10/27/15.
 */
define(['manualRecordModel','manualRecordView'], function (ManualRecordModel, ManualRecordView) {

    console.log("creating manualRecordController module");

    var manualRecordController = {

        appController: null,

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

            var self = this;

            this.listenTo(this.manualRecordView, "manualRecordModelUpdateComplete", function() {
                console.log("ManualRecordController:: manualRecordModelUpdateComplete event received");
                this.manualRecordModel.save();
                return false;
            });
            this.listenTo(this.manualRecordView, "invokeHome", function() {
                console.log("manualRecordController:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });
            this.listenTo(this.manualRecordView, "eraseUI", function() {
                console.log("manualRecordController:: eraseUI event received");
                self.trigger("eraseUI");
                return false;
            });
        },

        show: function() {
            console.log("manualRecordController:show() invoked");
            this.manualRecordView.show();
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(targetPage, remoteCommand) {
                if (targetPage == "manualRecordPage") {
                    console.log("manualRecordController: remoteCommand received.");
                    this.manualRecordView.executeRemoteCommand(remoteCommand);
                }
            });
        }
    };

    manualRecordController.init();
    return manualRecordController;
});
