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

            //this.listenTo(this.recordNowView, "executerecordNow", function() {
            //    console.log("recordNowController:: executerecordNow event received");
            //    return false;
            //});
            this.listenTo(this.recordNowView, "recordNowModelUpdateComplete", function() {
                console.log("recordNowController:: recordNowModelUpdateComplete event received");
                this.recordNowModel.save();
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
                }
            });
        }
    };

    recordNowController.init();
    return recordNowController;
});
