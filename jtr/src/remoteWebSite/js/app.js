/**
 * Created by tedshaffer on 10/25/15.
 */
// joelnotes
// lowercase for objects; uppercase for classes; applies to FileNames and Variables

define(function() {
    $(document).ready(function () {
        require(['serverInterface','settingsController','channelGuideController','mainMenuController','footerController'],
            function(ServerInterface,SettingsController,ChannelGuideController,MainMenuController,FooterController) {

                // joelnotes - app.js depends on serverInterface. it and all controllers depend on serverAccessor.
                // app.js invokes set on serverAccessor. controllers get from server accessor
                // shouldn't there be some way of knowing that a module is loaded.
                // how to implement singletons using AMD / require.js

                // joelnotes - loading. load on startup or when user presses button. do it when user presses button if code is always
                // going to want the latest data and the app is not getting notified when changes occur.

                // joelnotes - don't render channel guide until data is loaded. uses promises to determine this. or put up a busy cursor while
                // data is getting loaded.

                console.log("all controllers loaded");

                // instead of doing the following, just invoke the ServerInterface method to get a promise. then wait for all promises to finish
                SettingsController.retrieveData();
                ChannelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = ServerInterface.retrieveScheduledRecordings();
                // wait until all data is retrieved??

                this.mainMenuController = MainMenuController;
                this.footerController = FooterController;

                this.mainMenuController.show();
                this.footerController.show();

                _.extend(this, Backbone.Events);

                this.listenTo(this.footerController, "invokeHome", function() {
                    console.log("app.js:: invokeHome event received");

                    // erase all main div's
                    $("#manualRecordPage").css("display", "none");
                    $("#channelGuidePage").css("display", "none");
                    $("#recordedShowsPage").css("display", "none");
                    $("#scheduledRecordingsPage").css("display", "none");

                    this.mainMenuController.show();

                    return false;
                });

                this.serverInterface = ServerInterface;
                var self = this;

                this.listenTo(this.footerController, "invokeRemote", function(id) {
                    console.log("app.js:: invokeRemote event received, id = " + id);

                    var cmd;

                    switch (id) {
                        case "btnRemoteRecord":
                        case "remoteRecord":
                            cmd = "record";
                            break;
                        case "btnRemoteStop":
                        case "remoteStop":
                            cmd = "stop";
                            break;
                        case "btnRemoteRewind":
                        case "remoteRewind":
                            cmd = "rewind";
                            break;
                        case "btnRemoteInstantReplay":
                        case "remoteInstantReplay":
                            cmd = "instantReplay";
                            break;
                        case "btnRemotePause":
                        case "remotePause":
                            cmd = "pause";
                            break;
                        case "btnRemotePlay":
                        case "remotePlay":
                            cmd = "play";
                            break;
                        case "btnRemoteQuickSkip":
                        case "remoteQuickSkip":
                            cmd = "quickSkip";
                            break;
                        case "btnRemoteFastForward":
                        case "remoteFastForward":
                            cmd = "fastForward";
                            break;
                    };

                    var commandData = { "command": "remoteCommand", "value": cmd };
                    var remotePromise = self.serverInterface.browserCommand(commandData);

                    return false;
                });
            });
    });
});
