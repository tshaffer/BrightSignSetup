/**
 * Created by tedshaffer on 10/27/15.
 */
define(['serverInterface', 'mainMenuView','manualRecordController', 'recordedShowsController', 'channelGuideController','scheduledRecordingsController'],
    function (ServerInterface, MainMenuView, ManualRecordController, RecordedShowsController, ChannelGuideController,ScheduledRecordingsController) {

    var mainMenuController = {
        p1: 69,

        mainMenuView: null,

        init: function() {

            //ChannelGuideController.setServerInterface(ServerInterface);
            //ManualRecordController.setServerInterface(ServerInterface);
            //RecordedShowsController.setServerInterface(ServerInterface);

            this.mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            this.listenTo(this.mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
                $(this.mainMenuView.el).hide();

                var recordedShowsController = RecordedShowsController;
                recordedShowsController.show();
            });

            this.listenTo(this.mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(this.mainMenuView.el).hide();

                // note - do not invoke new on ManualRecordController
                var manualRecordController = ManualRecordController;
                manualRecordController.show();
            });

            this.listenTo(this.mainMenuView, "invokeChannelGuide", function () {
                console.log("MainMenuController:: invokeChannelGuide event received");
                $(this.mainMenuView.el).hide();

                var channelGuideController = ChannelGuideController;
                channelGuideController.show();
            });

            this.listenTo(this.mainMenuView, "invokeScheduledRecordings", function () {
                console.log("MainMenuController:: invokeScheduledRecordings event received");
                $(this.mainMenuView.el).hide();

                var scheduledRecordingsController = ScheduledRecordingsController;
                scheduledRecordingsController.show();
            });
        },

        show: function() {
            console.log("mainMenuController:show() invoked");
            this.mainMenuView.show();
        },


    };

    mainMenuController.init();
    return mainMenuController;
});
