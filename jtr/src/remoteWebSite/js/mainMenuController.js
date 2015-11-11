/**
 * Created by tedshaffer on 10/27/15.
 */
define(['serverInterface', 'mainMenuView','manualRecordController', 'recordedShowsController', 'channelGuideController'], function (ServerInterface, MainMenuView, ManualRecordController, RecordedShowsController, ChannelGuideController) {

    var mainMenuController = {
        p1: 69,

        init: function() {

            ChannelGuideController.setServerInterface(ServerInterface);
            ManualRecordController.setServerInterface(ServerInterface);
            RecordedShowsController.setServerInterface(ServerInterface);

            var mainMenuView = new MainMenuView({el: $("#homePage")});

            _.extend(this, Backbone.Events);

            this.listenTo(mainMenuView, "invokeRecordedShows", function () {
                console.log("MainMenuController:: invokeRecordedShowsHandler event received");
                $(mainMenuView.el).hide();

                var recordedShowsController = RecordedShowsController;
                recordedShowsController.show();
            });

            this.listenTo(mainMenuView, "invokeManualRecord", function () {
                console.log("MainMenuController:: invokeManualRecord event received");
                $(mainMenuView.el).hide();

                // note - do not invoke new on ManualRecordController
                var manualRecordController = ManualRecordController;
                manualRecordController.show();
            });

            this.listenTo(mainMenuView, "invokeChannelGuide", function () {
                console.log("MainMenuController:: invokeChannelGuide event received");
                $(mainMenuView.el).hide();

                var channelGuideController = ChannelGuideController;
                channelGuideController.show();
            });
        }
    };

    mainMenuController.init();
    return mainMenuController;
});
