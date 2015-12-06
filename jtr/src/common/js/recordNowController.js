/**
 * Created by tedshaffer on 11/18/15.
 */
define(['recordNowModel','recordNowView'], function (recordNowModel, recordNowView) {

    console.log("creating recordNowController module");

    var recordNowController = {

        appController: null,

        recordNowModel: null,
        recordNowView: null,

        init: function() {

            this.recordNowModel = new recordNowModel({
                channel: '5'
            });

            this.recordNowView = new recordNowView({
                el: $("#recordNowPage"),
                model: this.recordNowModel
            });

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.recordNowView, "recordNowModelUpdateComplete", function() {
                console.log("recordNowController:: recordNowModelUpdateComplete event received");
                this.recordNowModel.save();
                return false;
            });

            this.listenTo(this.recordNowView, "invokeHome", function() {
                console.log("recordNowController:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });

            this.listenTo(this.recordNowView, "eraseUI", function() {
                console.log("recordNowView:: eraseUI event received");
                self.trigger("eraseUI");
                return false;
            });
        },

        show: function() {
            console.log("recordNowController:show() invoked");
            this.recordNowView.show();
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(targetPage, remoteCommand) {
                if (targetPage == "recordNowPage") {
                    console.log("recordNowController: remoteCommand received.");
                    this.recordNowView.executeRemoteCommand(remoteCommand);
                }
            });
        }
    };

    recordNowController.init();
    return recordNowController;
});
