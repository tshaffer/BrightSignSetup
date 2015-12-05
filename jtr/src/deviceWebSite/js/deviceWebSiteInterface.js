/**
 * Created by tedshaffer on 12/5/15.
 */
define(function () {

    console.log("creating deviceWebSiteInit module");

    // ??
    // _currentRecordings

    var hostController = {

        appController: null,
        lastRemoteEventTime:  0,

        init: function () {

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

            var self = this;

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
                        //initializeEpgData();

                        //retrieveSettings(indicateReady);
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

            initializeEpgData();
            this.indicateReady();
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
                    this.appController.executeReturnToHome();       // JTRTODO - send message instead?
                }
                else if (remoteCommand == "RECORDED_SHOWS") {
                    this.appController.executeDisplayRecordedShows();
                }
                else if (remoteCommand == "GUIDE") {
                    this.appController.executeDisplayChannelGuide();
                }
                else if (remoteCommand == "0" || remoteCommand == "1" || remoteCommand == "2" || remoteCommand == "3" || remoteCommand == "4" || remoteCommand == "5" || remoteCommand == "6" || remoteCommand == "7" || remoteCommand == "8" || remoteCommand == "9" || remoteCommand == "-" || remoteCommand == "ENTER" || remoteCommand == "CHANNEL_UP" || remoteCommand == "CHANNEL_DOWN" || remoteCommand == "JUMP" || remoteCommand == "PAUSE" || remoteCommand == "PLAY" || remoteCommand == "FF" || remoteCommand == "RW" || remoteCommand == "INSTANT_REPLAY" || remoteCommand == "QUICK_SKIP" || remoteCommand == "PROGRESS_BAR" || remoteCommand == "CLOCK") {
                    this.appController.executeRemoteCommand(remoteCommand.toLowerCase());
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
                                else if (eventType == "keydown" && (remoteCommand == "STOP" || remoteCommand == "EXIT" || remoteCommand == "RECORD" || remoteCommand == "UP" || remoteCommand == "DOWN" | remoteCommand == "LEFT" || remoteCommand == "RIGHT" || remoteCommand == "HIGHEST_SPEED_RW" || remoteCommand == "PREV" || remoteCommand == "NEXT" || remoteCommand ==  "HIGHEST_SPEED_FW")) {
                                    //left = 37
                                    //up = 38
                                    //right = 39
                                    //down = 40
                                    console.log("handlers eventType = " + eventType);
                                    var handlersForKey = handlers[eventType];
                                    //$.each(handlersForKey, function (index, handlerForKey) {
                                    for (index = 0; index < handlersForKey.length; index++) {
                                        handlerForKey = handlersForKey[index];

                                        if (handlerForKey.namespace != "bs.dismiss.modal") {

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
                                                default:
                                                    event.which = remoteCommand.toLowerCase();
                                                    break;
                                                //case "highest_speed_rw":
                                                //    event.which = "highest_speed_rw";
                                                //    break;
                                                //case "highest_speed_fw":
                                                //    event.which = "highest_speed_fw";
                                                //    break;
                                                //case "prev":
                                                //    event.which = "prev";
                                                //    break;
                                                //case "next":
                                                //    event.which = "next";
                                                //    break;
                                                //case "exit":
                                                //    event.which = "exit";
                                                //    break;
                                                //case "record":
                                                //    event.which = "record";
                                                //    break;
                                                //case "stop":
                                                //    event.which = "stop";
                                                //    break;
                                            }
                                            //event.which = remoteCommand.toLowerCase();
                                            //event.data = handlerForKey.data;
                                            // set event.target to currentElement?
                                            event.target = currentElement;
                                            handlerForKey.handler(event);
                                            inputHandled = true;
                                            return false;
                                        }
                                    }
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

        indicateReady: function() {
            // post message indicating that initialization is complete ??
            event["EventType"] = "READY";
            postMessage(event);
        },

        setAppController: function(appController) {
            this.appController = appController;
        }

    }

    //hostController.init();

    return hostController;
});

