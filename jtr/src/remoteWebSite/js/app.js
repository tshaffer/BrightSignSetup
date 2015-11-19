/**
 * Created by tedshaffer on 10/25/15.
 */
define(function() {
    $(document).ready(function () {
        require(['serverInterface','settingsController','channelGuideController','mainMenuController','footerController'],
            function(serverInterface,settingsController,channelGuideController,mainMenuController,footerController) {

                console.log("all controllers loaded");

                // JTRTODO - instead of doing the following, just invoke the serverInterface method to get a promise. then wait for all promises to finish
                settingsController.retrieveData();
                channelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = serverInterface.retrieveScheduledRecordings();

                this.mainMenuController = mainMenuController;
                this.footerController = footerController;

                this.mainMenuController.show();
                this.footerController.show();

                _.extend(this, Backbone.Events);

                this.listenTo(this.footerController, "invokeHome", function() {
                    console.log("app.js:: invokeHome event received");

                    // erase all main div's
                    $("#manualRecordPage").css("display", "none");
                    $("#recordNowPage").css("display", "none");
                    $("#channelGuidePage").css("display", "none");
                    $("#recordedShowsPage").css("display", "none");
                    $("#scheduledRecordingsPage").css("display", "none");
                    $("#settingsPage").css("display", "none");

                    this.mainMenuController.show();

                    return false;
                });

                this.serverInterface = serverInterface;
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
