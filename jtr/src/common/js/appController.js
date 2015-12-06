/**
 * Created by tedshaffer on 10/25/15.
 */
define(['hostInterface', 'serverInterface','mainMenuController','recordedShowsController','recordNowController','manualRecordController','channelGuideController','scheduledRecordingsController','settingsController','footerController','deleteShowView'],
    function(hostInterface, serverInterface,mainMenuController,recordedShowsController,recordNowController,manualRecordController,channelGuideController,scheduledRecordingsController,settingsController,footerController,DeleteShowView) {

        console.log("******************* - creating appController module");

        var appController = {

            deleteShowView: null,
            activeRecordingId: -1,

            init: function () {

                _.extend(this, Backbone.Events);

                var self = this;

                console.log("all controllers loaded");

                hostInterface.init();

                this.serverInterface = serverInterface;
                this.serverInterface.setBaseURL(baseURL);

                //initializeBrightSign();

                mainMenuController.setAppController(this);
                recordedShowsController.setAppController(this);
                recordNowController.setAppController(this);
                manualRecordController.setAppController(this);
                channelGuideController.setAppController(this);
                scheduledRecordingsController.setAppController(this);
                settingsController.setAppController(this);
                hostInterface.setAppController(this);

                // JTRTODO - instead of doing the following, just invoke the serverInterface method to get a promise. then wait for all promises to finish
                settingsController.retrieveData();
                channelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = serverInterface.retrieveScheduledRecordings();

                this.mainMenuController = mainMenuController;
                this.footerController = footerController;

                this.mainMenuController.show();
                this.footerController.show();

                this.activePage = "homePage";

                this.listenTo(mainMenuController, "activePageChange", function (newActivePage) {
                    self.activePage = newActivePage;
                });

                this.listenTo(recordedShowsController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(recordedShowsController, "eraseUI", function () {
                    this.eraseUI();
                });

                this.listenTo(recordedShowsController, "activeRecordingId", function(activeRecordingId) {
                    self.activeRecordingId = activeRecordingId;
                })

                this.listenTo(mainMenuController, "eraseUI", function () {
                    this.eraseUI();
                });

                this.listenTo(mainMenuController, "stop", function () {
                    this.stop();
                });

                this.listenTo(recordNowController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(manualRecordController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(channelGuideController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(scheduledRecordingsController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(settingsController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(footerController, "invokeHome", function () {
                    this.executeReturnToHome();
                });

                this.listenTo(this.footerController, "invokeRemote", function (id) {
                    this.executeRemoteCommand(id);
                    return false;
                });

                this.listenTo(this.mainMenuController, "invokeLiveVideo", function (id) {
                    this.executeLiveVideo();
                    return false;
                });

                $("#cont").keydown(function (keyEvent) {
                    //console.log("key pressed: " + keyEvent.which)
                });

                console.log("JTR javascript .ready invoked");
                console.log("User Agent: " + navigator.userAgent);

                // get client from user agent
                var userAgent = navigator.userAgent;
                if (userAgent.indexOf("BrightSign") >= 0) {
                    clientType = "BrightSign"
                }
                else if (userAgent.indexOf("iPad") >= 0) {
                    clientType = "iPad"
                }

                if (userAgent.indexOf("Mac") >= 0 && userAgent.indexOf("Chrome") < 0) {
                    browserTypeIsSafari = true;
                }
                else {
                    browserTypeIsSafari = false;
                }

                //hostInterface.init();
            },

            executeReturnToHome: function() {
                this.eraseUI();
                this.mainMenuController.show();
                return false;
            },

            executeDisplayRecordedShows: function() {
                this.eraseUI();
                recordedShowsController.show();
                return false;
            },

            executeDisplayChannelGuide: function() {
                this.eraseUI();
                channelGuideController.show();
                return false;
            },

            executeLiveVideo: function() {

                var self = this;

                var promise = this.serverInterface.retrieveLastTunedChannel();
                promise.then(function() {
                    var lastTunedChannel = self.serverInterface.getLastTunedChannel();
                    var commandData = {"command": "tuneLiveVideoChannel", "enteredChannel": lastTunedChannel};
                    var remotePromise = self.serverInterface.browserCommand(commandData);
                })

                return false;
            },

            executeRemoteCommand: function(id) {

                console.log("app.js:: invokeRemote event received, id = " + id);

                var cmd;

                switch (id) {
                    case "0":
                    case "1":
                    case "2":
                    case "3":
                    case "4":
                    case "5":
                    case "6":
                    case "7":
                    case "8":
                    case "9":
                    case "-":
                    case "channel_up":
                    case "channel_down":
                    case "enter":
                        cmd = id;
                        break;
                    case "clock":
                        cmd = "clock";
                        break;
                    case "progress_bar":
                        cmd = "progress_bar";
                        break;
                    case "jump":
                        cmd = "jump";
                        break;
                    case "btnRemoteRecord":
                    case "remoteRecord":
                    case "record":
                        cmd = "record";
                        break;
                    //case "btnRemoteStop":
                    //case "remoteStop":
                    //case "stop":
                    //    cmd = "stop";
                    //    break;
                    case "btnRemoteRewind":
                    case "remoteRewind":
                    case "rw":
                        cmd = "rewind";
                        break;
                    case "btnRemoteInstantReplay":
                    case "remoteInstantReplay":
                    case "instant_replay":
                        cmd = "instantReplay";
                        break;
                    case "btnRemotePause":
                    case "remotePause":
                    case "pause":
                        cmd = "pause";
                        break;
                    case "btnRemotePlay":
                    case "remotePlay":
                    case "play":
                        cmd = "play";
                        break;
                    case "btnRemoteQuickSkip":
                    case "remoteQuickSkip":
                    case "quick_skip":
                        cmd = "quickSkip";
                        break;
                    case "btnRemoteFastForward":
                    case "remoteFastForward":
                    case "ff":
                        cmd = "fastForward";
                        break;
                };

                var commandData = {"command": "remoteCommand", "value": cmd};
                var remotePromise = this.serverInterface.browserCommand(commandData);
            },

            eraseUI: function() {
                // erase all main div's
                $("#homePage").css("display", "none");
                $("#manualRecordPage").css("display", "none");
                $("#recordNowPage").css("display", "none");
                $("#channelGuidePage").css("display", "none");
                $("#recordedShowsPage").css("display", "none");
                $("#scheduledRecordingsPage").css("display", "none");
                $("#settingsPage").css("display", "none");

                $("#IPAddressLabel").hide();

                $("#cgSeriesDlg").modal('hide');
                $("#cgScheduledSeriesDlg").modal('hide');
                $("#cgScheduledRecordingDlg").modal('hide');
                $("#cgProgramDlg").modal('hide');
                $("#cgScheduledRecordingDlg").modal('hide');
                $("#cgRecordingOptionsDlg").modal('hide');

            },

            stop: function() {
                this.executeRemoteCommand("pause");

                //var event = {};
                //event["EventType"] = "DISPLAY_DELETE_SHOW_DLG";
                //event["Title"] = this.stateMachine.currentRecording.Title;
                //event["RecordingId"] = this.stateMachine.currentRecording.RecordingId;
                //postMessage(event);

                //var title = event["Title"];
                //var recordingId = event["RecordingId"];
                //displayDeleteShowDlg(title, recordingId);

                this.eraseUI();

                this.displayDeleteShowDlg("Pizza", 69);

                return false;
            },

            displayDeleteShowDlg: function(showTitle, showRecordingId) {

                this.deleteShowView = new DeleteShowView();
                this.deleteShowView.show("pizza", this.activeRecordingId);

                //console.log("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", showRecordingId=" + showRecordingId);
                //
                ////_showRecordingId = showRecordingId;
                //
                //var options = {
                //    "backdrop": "true"
                //}
                //$('#deleteShowDlg').modal(options);
                //$('#deleteShowDlgShowTitle').html("Delete '" + showTitle + "'?");
                //
                //modalDialogDisplayed = true;
                //selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
                //unselectedDeleteShowDlgElement = "#deleteShowDlgClose";
                //
                //// when dialog is displayed, highlight Delete, unhighlight Close
                //$(selectedDeleteShowDlgElement).removeClass("btn-secondary");
                //$(selectedDeleteShowDlgElement).addClass("btn-primary");
                //
                //$(unselectedDeleteShowDlgElement).removeClass("btn-primary");
                //$(unselectedDeleteShowDlgElement).addClass("btn-secondary");
            },

//function deleteShowDlgCloseInvoked() {
//    consoleLog("deleteShowDlgCloseInvoked");
//    $('#deleteShowDlg').modal('hide');
//    modalDialogDisplayed = false;
//    //switchToPage("homePage");
//}
//
//function deleteShowDlgDeleteInvoked() {
//    consoleLog("deleteShowDlgDeleteInvoked");
//    $('#deleteShowDlg').modal('hide');
//    modalDialogDisplayed = false;
//    executeDeleteSelectedShow(_showRecordingId);
//    //switchToPage("homePage");
//}

            serverLaunchedVideo: function() {
                // hack - taking advantage of knowledge that this is only invoked when running on the device
                this.eraseUI();
            }
        }

        appController.init();

        return appController;

    });