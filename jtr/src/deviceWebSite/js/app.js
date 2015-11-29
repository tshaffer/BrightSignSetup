/**
 * Created by tedshaffer on 10/25/15.
 */
define(['serverInterface','mainMenuController','recordedShowsController','recordNowController','manualRecordController','channelGuideController','scheduledRecordingsController','settingsController','footerController'],
    function(serverInterface,mainMenuController,recordedShowsController,recordNowController,manualRecordController,channelGuideController,scheduledRecordingsController,settingsController,footerController) {

        console.log("creating appController module");

        var appController = {

            lastRemoteEventTime:  0,

            init: function () {

                _.extend(this, Backbone.Events);

                var self = this;

                console.log("all controllers loaded");

                //initializeBrightSign();

                mainMenuController.setAppController(this);
                recordedShowsController.setAppController(this);
                recordNowController.setAppController(this);
                manualRecordController.setAppController(this);
                channelGuideController.setAppController(this);
                scheduledRecordingsController.setAppController(this);
                settingsController.setAppController(this);

                // JTRTODO - instead of doing the following, just invoke the serverInterface method to get a promise. then wait for all promises to finish
                settingsController.retrieveData();
                channelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = serverInterface.retrieveScheduledRecordings();

                this.mainMenuController = mainMenuController;
                this.footerController = footerController;

                this.mainMenuController.show();
                this.footerController.show();

                this.serverInterface = serverInterface;

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

                // taken from BrightSign.js
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

                // ir receiver
                try {
                    ir_receiver = new BSIRReceiver("Iguana", "NEC");
                }
                catch (err) {
                    console.log("********************************************************************* UNABLE TO CREATE IR_RECEIVER ***************************** ");
                }

                // Create displayEngine state machine
                displayEngineHSM = new displayEngineStateMachine();

                // Create recordingEngine state machine
                recordingEngineHSM = new recordingEngineStateMachine();

                registerStateMachine(displayEngineHSM);
                displayEngineHSM.Initialize();

                registerStateMachine(recordingEngineHSM);
                recordingEngineHSM.Initialize();

                if (typeof ir_receiver != 'undefined') {
                    ir_receiver.onremotedown = function (e) {
                        self.processIRInput(e);
                    }

                    //ir_receiver.onremoteup = function (e) {
                    //    console.log('############ onremoteup: ' + e.irType + " - " + e.code);
                    //}
                }

                // ir transmitter
                try {
                    ir_transmitter = new BSIRTransmitter("IR-out");
                    resetHDMIInputPort();
                }
                catch (err) {
                    console.log("unable to create ir_transmitter");
                }

                // put in appropriate place - is this too early?
                initializeEpgData();

                // message port for getting messages from the BrightSign via roMessagePort
                bsMessage = new BSMessagePort();
                console.log("typeof bsMessage is " + typeof bsMessage);
                bsMessage.PostBSMessage({message: "javascript ready"});

                bsMessage.onbsmessage = function (msg) {
                    console.log("onbsmessage invoked");

                    var message = {};

                    for (name in msg.data) {
                        console.log('### ' + name + ': ' + msg.data[name]);
                        message[name] = msg.data[name];
                    }

                    var event = {};

                    switch (message.command) {
                        case "setIPAddress":
                            var brightSignIPAddress = message.value;
                            $("#ipAddress").html("ip address: " + brightSignIPAddress);
                            baseURL = "http://" + brightSignIPAddress + ":8080/";
                            console.log("baseURL from BrightSign message is: " + baseURL);

                            // temporary location - JTRTODO
                            initializeEpgData();

                            retrieveSettings(indicateReady);
                            break;
                        case "remoteCommand":
                            var event = {};
                            event["EventType"] = "REMOTE";
                            event["EventData"] = message.value;
                            postMessage(event);
                            break;
                        case "recordings":
                            //initializeEpgData();
                            var recordings = JSON.parse(message.value);
                            var jtrRecordings = recordings.recordings;
                            _currentRecordings = {};
                            $.each(jtrRecordings, function (index, jtrRecording) {
                                _currentRecordings[jtrRecording.RecordingId] = jtrRecording;
                            });
                            break;
                        case "playRecordedShow":
                            event["EventType"] = "PLAY_RECORDED_SHOW";
                            event["EventData"] = message.recordingId;
                            postMessage(event);
                            break;
                        case "stopRecording":
                            event["EventType"] = "STOP_RECORDING";
                            event["EventData"] = message.value;
                            postMessage(event);
                            break;
                        case "deleteRecordedShow":
                            event["EventType"] = "DELETE_RECORDED_SHOW";
                            event["EventData"] = msg.data[name];
                            postMessage(event);
                            break;
                        case "deleteScheduledRecording":
                            event["EventType"] = "DELETE_SCHEDULED_RECORDING";
                            //event["EventData"] = message.scheduledRecordingId;
                            postMessage(event);
                            break;
                        case "updateScheduledRecording":
                            event["EventType"] = "UPDATE_SCHEDULED_RECORDING";
                            event["Id"] = message.id;
                            event["StartTimeOffset"] = message.startTimeOffset;
                            event["StopTimeOffset"] = message.stopTimeOffset;
                            postMessage(event);
                            break;
                        case "addRecord":
                            event["EventType"] = "ADD_RECORD";
                            event["DateTime"] = message.dateTime;
                            event["Title"] = message.title;
                            event["Duration"] = message.duration;
                            event["InputSource"] = message.inputSource;
                            event["Channel"] = message.channel;
                            event["RecordingBitRate"] = message.recordingBitRate;
                            event["SegmentRecording"] = message.segmentRecording;
                            event["ScheduledSeriesRecordingId"] = message.scheduledSeriesRecordingId;
                            event["StartTimeOffset"] = message.startTimeOffset;
                            event["StopTimeOffset"] = message.stopTimeOffset;
                            postMessage(event);
                            break;
                        case "addSeries":
                            event["EventType"] = "ADD_SERIES";
                            event["Title"] = message.title;
                            event["InputSource"] = message.inputSource;
                            event["Channel"] = message.channel;
                            event["RecordingBitRate"] = message.recordingBitRate;
                            event["SegmentRecording"] = message.segmentRecording;
                            event["ScheduledSeriesRecordingId"] = message.scheduledSeriesRecordingId;
                            postMessage(event);
                            break;
                        case "recordNow":
                            event["EventType"] = "RECORD_NOW";
                            event["Title"] = message.title;
                            event["Duration"] = message.duration;
                            event["InputSource"] = message.inputSource;
                            event["Channel"] = message.channel;
                            event["RecordingBitRate"] = message.recordingBitRate;
                            event["SegmentRecording"] = message.segmentRecording;
                            event["ScheduledSeriesRecordingId"] = -1;
                            postMessage(event);
                            break;
                        case "manualRecord":
                            event["EventType"] = "ADD_RECORD";
                            event["DateTime"] = message.dateTime;
                            event["Title"] = message.title;
                            event["Duration"] = message.duration;
                            event["InputSource"] = message.inputSource;
                            event["Channel"] = message.channel;
                            event["RecordingBitRate"] = message.recordingBitRate;
                            event["SegmentRecording"] = message.segmentRecording;
                            event["ScheduledSeriesRecordingId"] = -1;
                            event["StartTimeOffset"] = 0;
                            event["StopTimeOffset"] = 0;
                            postMessage(event);
                            break;
                        case "tuneLiveVideoChannel":
                            // first tune to live video
                            event["EventType"] = "TUNE_LIVE_VIDEO";
                            postMessage(event);
                            // next, tune to the channel
                            event = {};
                            event["EventType"] = "TUNE_LIVE_VIDEO_CHANNEL";
                            event["EnteredChannel"] = message.enteredChannel;
                            postMessage(event);
                            break;
                        case "updateProgressBar":
                            event["EventType"] = "UPDATE_PROGRESS_BAR";
                            event["Offset"] = message.currentOffset;
                            event["Duration"] = message.recordingDuration;  // in seconds
                            postMessage(event);
                            break;
                        case "mediaEnd":
                            event["EventType"] = "MEDIA_END";
                            postMessage(event);
                            break;
                        case "epgDBUpdatesComplete":
                            event["EventType"] = "EPG_DB_UPDATES_COMPLETE";
                            postMessage(event);
                            break;
                    }
                }
            },

            processIRInput: function(e) {

                var self = this;

                console.log('############ onremotedown: ' + e.irType + " - " + e.code);
                var remoteCommand = GetRemoteCommand(e.code);
                console.log('############ onremotedown: remoteCommand=' + remoteCommand);

                // debounce remote
                var now = new Date();
                var msSinceLastCommand = now - this.lastRemoteEventTime;
                console.log("msSinceLastCommand=" + msSinceLastCommand);
                if (msSinceLastCommand > 400) {
                    this.lastRemoteEventTime = now;

                    // handle hard keys here
                    if (remoteCommand == "MENU") {
                        this.executeReturnToHome();
                    }
                    else if (remoteCommand == "RECORDED_SHOWS") {
                        this.executeDisplayRecordedShows();
                    }
                    else if (remoteCommand == "GUIDE") {
                        this.executeDisplayChannelGuide();
                    }
                    else if (remoteCommand == "JUMP" || remoteCommand == "PAUSE" || remoteCommand == "PLAY" || remoteCommand == "FF" || remoteCommand == "RW" || remoteCommand == "INSTANT_REPLAY" || remoteCommand == "QUICK_SKIP" || remoteCommand == "STOP" || remoteCommand == "RECORD" || remoteCommand == "PROGRESS_BAR" || remoteCommand == "CLOCK") {
                        this.executeRemoteCommand(remoteCommand.toLowerCase());
                    }
                    else {

                        var inputHandled = false;

                        //handlers = $._data( document.getElementById("recording1"), "events" )
                        var currentElement = document.activeElement;
                        var originalTarget = currentElement;

                        while (typeof currentElement == 'object') {

                            var handlers = $._data(currentElement, "events")
                            if (typeof handlers != 'undefined') {

                                for (var eventType in handlers) {

                                    // match handler event type to remote control key (only handle click for now)
                                    if (eventType == "click" && remoteCommand == "SELECT") {
                                        if (handlers.hasOwnProperty(eventType)) {
                                            console.log("handlers eventType = " + eventType);
                                            var handlersForKey = handlers[eventType];
                                            $.each(handlersForKey, function (index, handlerForKey) {
                                                // MEGAHACK
                                                if (handlerForKey.namespace != "bs.dismiss.modal") {
                                                    var event = {};
                                                    event.data = handlerForKey.data;
                                                    event.target = originalTarget;  // is this right? click always goes to the button that had focus when select was pressed.
                                                    handlerForKey.handler(event);
                                                    inputHandled = true;
                                                    return false;
                                                }
                                            });
                                        }
                                    }
                                    //else if (eventType == "keydown" && remoteCommand == "MENU") {
                                    //    if (handlers.hasOwnProperty(eventType)) {
                                    //        console.log("handlers eventType = " + eventType);
                                    //        var handlersForKey = handlers[eventType];
                                    //        $.each(handlersForKey, function (index, handlerForKey) {
                                    //            var event = {};
                                    //            event.which = "menu";
                                    //            event.data = handlerForKey.data;
                                    //            event.target = currentElement;
                                    //            var eventHandled = handlerForKey.handler(event);
                                    //            if (eventHandled) {
                                    //                inputHandled = true;
                                    //            }
                                    //            return false;
                                    //        });
                                    //    }
                                    //}
                                    else if (eventType == "keydown" && (remoteCommand == "UP" || remoteCommand == "DOWN" | remoteCommand == "LEFT" || remoteCommand == "RIGHT" || remoteCommand == "HIGHEST_SPEED_RW" || remoteCommand == "PREV" || remoteCommand == "NEXT" || remoteCommand ==  "HIGHEST_SPEED_FW")) {
                                        //left = 37
                                        //up = 38
                                        //right = 39
                                        //down = 40
                                        console.log("handlers eventType = " + eventType);
                                        var handlersForKey = handlers[eventType];
                                        $.each(handlersForKey, function (index, handlerForKey) {
                                            var event = {};
                                            switch (remoteCommand.toLowerCase()) {
                                                case "up":
                                                    event.which = 38;
                                                    break;
                                                case "down":
                                                    event.which = 40;
                                                    break;
                                                case "left":
                                                    event.which = 37;
                                                    break;
                                                case "right":
                                                    event.which = 39;
                                                    break;
                                                case "highest_speed_rw":
                                                    event.which = "highest_speed_rw";
                                                    break;
                                                case "highest_speed_fw":
                                                    event.which = "highest_speed_fw";
                                                    break;
                                                case "prev":
                                                    event.which = "prev";
                                                    break;
                                                case "next":
                                                    event.which = "next";
                                                    break;
                                            }
                                            //event.which = remoteCommand.toLowerCase();
                                            //event.data = handlerForKey.data;
                                            // set event.target to currentElement?
                                            event.target = currentElement;
                                            handlerForKey.handler(event);
                                            inputHandled = true;
                                            return false;
                                        });
                                    }
                                }
                            }

                            //if (!inputHandled) {
                            //    //debugger;
                            //    //self.trigger("remoteCommand", self.activePage, remoteCommand);
                            //}

                            if (inputHandled) {
                                return;
                            }

                            if (typeof currentElement.parentElement != "undefined") {
                                currentElement = currentElement.parentElement;
                            }
                        }
                    }

                }
                else {
                    console.log("ignore extraneous remote input");
                }
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

            executeRemoteCommand: function(id) {

                console.log("app.js:: invokeRemote event received, id = " + id);

                var cmd;

                switch (id) {
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
                    case "btnRemoteStop":
                    case "remoteStop":
                    case "stop":
                        cmd = "stop";
                        break;
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

                $("#cgSeriesDlg").modal('hide');
                $("#cgScheduledSeriesDlg").modal('hide');
                $("#cgScheduledRecordingDlg").modal('hide');
                $("#cgProgramDlg").modal('hide');
                $("#cgScheduledRecordingDlg").modal('hide');
                $("#cgRecordingOptionsDlg").modal('hide');

            },

        }

        appController.init();

    });