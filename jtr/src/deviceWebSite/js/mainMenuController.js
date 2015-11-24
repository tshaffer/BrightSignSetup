/**
 * Created by tedshaffer on 10/27/15.
 */
define(['mainMenuView','manualRecordController', 'recordNowController', 'recordedShowsController', 'channelGuideController','scheduledRecordingsController','settingsController'],
    function (MainMenuView, manualRecordController, recordNowController, recordedShowsController, channelGuideController,scheduledRecordingsController,settingsController) {

    console.log("creating mainMenuController module");

    var mainMenuController = {
        p1: 69,

        appController: null,

        mainMenuView: null,

        init: function() {

            this.mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            this.listenTo(this.mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
                $(this.mainMenuView.el).hide();

                this.trigger("activePageChange", "recordedShows");

                //var recordedShowsController = recordedShowsController;
                recordedShowsController.show();
            });

            this.listenTo(this.mainMenuView, "invokeRecordNow", function () {
                console.log("MainMenuController:: invokeRecordNow event received");
                $(this.mainMenuView.el).hide();

                recordNowController.show();
            });

            this.listenTo(this.mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(this.mainMenuView.el).hide();

                // note - do not invoke new on manualRecordController
                //var manualRecordController = manualRecordController;
                manualRecordController.show();
            });

            this.listenTo(this.mainMenuView, "invokeChannelGuide", function () {
                console.log("MainMenuController:: invokeChannelGuide event received");
                $(this.mainMenuView.el).hide();

                //var channelGuideController = channelGuideController;
                channelGuideController.show();
            });

            this.listenTo(this.mainMenuView, "invokeScheduledRecordings", function () {
                console.log("MainMenuController:: invokeScheduledRecordings event received");
                $(this.mainMenuView.el).hide();

                //var scheduledRecordingsController = scheduledRecordingsController;
                scheduledRecordingsController.show();
            });

            this.listenTo(this.mainMenuView, "invokeSettings", function () {
                console.log("MainMenuController:: invokeSettings event received");
                $(this.mainMenuView.el).hide();

                settingsController.show();
            });

        },

        show: function() {
            console.log("mainMenuController:show() invoked");
            this.mainMenuView.show();
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(activePage, remoteCommand) {
                console.log("remoteCommand received.");
            });

        }

    };

    mainMenuController.init();
    return mainMenuController;
});
