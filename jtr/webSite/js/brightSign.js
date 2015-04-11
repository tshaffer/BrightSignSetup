// BrightSign only
var bsMessage;
var ir_receiver;


// miscellaneous variables
var _showRecordingId;

var modalDialogDisplayed = false;
var selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
var unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

// BrightSign specific functionality
// delete dialog - BrightSign only for now
function displayDeleteShowDlg(showTitle, showRecordingId) {

    console.log("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", showRecordingId=" + showRecordingId);

    _showRecordingId = showRecordingId;

    var options = {
        "backdrop": "true"
    }
    $('#deleteShowDlg').modal(options);
    $('#deleteShowDlgShowTitle').html("Delete '" + showTitle + "'?");

    modalDialogDisplayed = true;
    selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
    unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

    // when dialog is displayed, highlight Delete, unhighlight Close
    $(selectedDeleteShowDlgElement).removeClass("btn-secondary");
    $(selectedDeleteShowDlgElement).addClass("btn-primary");

    $(unselectedDeleteShowDlgElement).removeClass("btn-primary");
    $(unselectedDeleteShowDlgElement).addClass("btn-secondary");
}

function deleteShowDlgCloseInvoked() {
    console.log("deleteShowDlgCloseInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    //switchToPage("homePage");
}

function deleteShowDlgDeleteInvoked() {
    console.log("deleteShowDlgDeleteInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    executeDeleteSelectedShow(_showRecordingId);
    //switchToPage("homePage");
}

// progress bar
function SecondsToHourMinuteLabel(numSeconds) {

    // convert seconds to hh:mm
    var hours = Math.floor(Number(numSeconds) / 3600).toString();
    hours = twoDigitFormat(hours);
    console.log("hours = " + hours);

    var minutes = Math.floor((Number(numSeconds) / 60) % 60).toString();
    minutes = twoDigitFormat(minutes);
    console.log("minutes = " + minutes);

    return hours + ":" + minutes;
}


// currently unused
//function togglePlayIcon() {
//    console.log("script.js:: togglePlayIcon invoked");
//    if (!$("#playIcon").length) {
//        console.log("script.js:: display play icon");
//        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
//        $("#videoControlRegion").append(toAppend);
//    } else {
//        console.log("script.js:: remove play icon");
//        $("#playIcon").remove();
//    }
//}

function executeRemoteCommand(remoteCommand) {
    console.log("executeRemoteCommand:" + remoteCommand);
    bsMessage.PostBSMessage({ command: "remoteCommand", "remoteCommand": remoteCommand });
}


function executeDeleteSelectedShow(recordingId) {

    console.log("executeDeleteSelectedShow " + recordingId);

    bsMessage.PostBSMessage({ command: "deleteRecordedShow", "recordingId": recordingId });
}


function initializeBrightSign() {
    var mrDateTime = "";
    var mrChannel = "";
    var mrRecordingDuration = "";
    var mrTitle = "";

    // Create displayEngine state machine
    displayEngineHSM = new displayEngineStateMachine();

    // Create recordingEngine state machine
    recordingEngineHSM = new recordingEngineStateMachine();

    // Create uiEngine state machine
    uiEngineHSM = new uiEngineStateMachine();

    // register state machines; UI first so that it gets events first.
    registerStateMachine(uiEngineHSM);
    uiEngineHSM.Initialize();

    registerStateMachine(displayEngineHSM);
    displayEngineHSM.Initialize();

    registerStateMachine(recordingEngineHSM);
    recordingEngineHSM.Initialize();

    // ir receiver
    try
    {
        ir_receiver = new BSIRReceiver("Iguana", "NEC");
    }
    catch (err) {
        console.log("unable to create ir_receiver");
    }

    console.log("typeof ir_receiver is " + typeof ir_receiver);

    if (typeof ir_receiver != 'undefined') {
        ir_receiver.onremotedown = function (e) {
            console.log('############ onremotedown: ' + e.irType + " - " + e.code);
            console.log('############ onremotedown: remoteCommand=' + GetRemoteCommand(e.code));

            var event = {};
            event["EventType"] = "REMOTE";
            event["EventData"] = GetRemoteCommand(e.code);
            postMessage(event);
        }

        ir_receiver.onremoteup = function (e) {
            console.log('############ onremoteup: ' + e.irType + " - " + e.code);
        }
    }

    // message port for getting messages from the BrightSign via roMessagePort
    bsMessage = new BSMessagePort();
    console.log("typeof bsMessage is " + typeof bsMessage);
    bsMessage.PostBSMessage({ message: "javascript ready" });

    bsMessage.onbsmessage = function (msg) {
        console.log("onbsmessage invoked");
        for (name in msg.data) {
            console.log('### ' + name + ': ' + msg.data[name]);

            if (name == "ipAddress") {
                var brightSignIPAddress = msg.data[name];
                $("#ipAddress").html("ip address: " + brightSignIPAddress);
                baseURL = "http://" + brightSignIPAddress + ":8080/";
                console.log("baseURL from BrightSign message is: " + baseURL);

                // post message indicating that initialization is complete ??
                var event = {};
                event["EventType"] = "READY";
                postMessage(event);

            }
            else if (name == "recordings") {
                console.log("recordings received from device bs");
                var recordings = JSON.parse(msg.data[name]);
                var jtrRecordings = recordings.recordings;
                _currentRecordings = {};
                $.each(jtrRecordings, function (index, jtrRecording) {
                    _currentRecordings[jtrRecording.RecordingId] = jtrRecording;
                });
            }
            else if (name == "remoteCommand") {
                var remoteCommand = msg.data[name];
                console.log("remoteCommand: " + remoteCommand);

                var event = {};
                event["EventType"] = "REMOTE";
                event["EventData"] = remoteCommand;
                postMessage(event);
            }
            else if (name == "commandPlayRecordedShow") {
                var recordingId = msg.data[name];
                console.log("playRecordedShow " + recordingId);

                var event = {};
                event["EventType"] = "PLAY_RECORDED_SHOW";
                event["EventData"] = recordingId;
                postMessage(event);
            }
            else if (name == "commandDeleteRecordedShow") {
                var recordingId = msg.data[name];
                console.log("deleteRecordedShow " + recordingId);

                var event = {};
                event["EventType"] = "DELETE_RECORDED_SHOW";
                event["EventData"] = recordingId;
                postMessage(event);
            }
            else if (name.lastIndexOf("commandSetManualRecord") == 0) {
                console.log("INVOKE SET MANUAL RECORD");

                var parameterValue = msg.data[name];
                if (name == "commandSetManualRecord[dateTime]") {
                    mrDateTime = parameterValue;
                    console.log("dateTime=" + mrDateTime);
                }
                else if (name == "commandSetManualRecord[channel]") {
                    mrChannel = parameterValue;
                    console.log("channel=" + mrChannel);
                }
                else if (name == "commandSetManualRecord[duration]") {
                    mrRecordingDuration = parameterValue;
                    console.log("duration=" + mrRecordingDuration);
                }
                else if (name == "commandSetManualRecord[title]") {
                    mrTitle = parameterValue;
                    console.log("title=" + mrTitle);
                }
                else if (name == "commandSetManualRecord[useTuner]") {
                    var useTuner = parameterValue;
                    console.log("useTuner=" + useTuner);

                    // hack? useTuner is the last parameter so post message now
                    var event = {}
                    event["EventType"] = "SET_MANUAL_RECORD";
                    event["DateTime"] = mrDateTime;
                    event["Title"] = mrTitle;
                    event["Duration"] = mrRecordingDuration;
                    event["UseTuner"] = useTuner;
                    event["Channel"] = mrChannel;
                    postMessage(event);
                }

            }
            else if (name.lastIndexOf("commandRecordNow") == 0) {
                console.log("commandRecordNow invoked");
                var parameterValue = msg.data[name];
                if (name == "commandRecordNow[duration]") {
                    recordingDuration = parameterValue;
                    console.log("duration=" + recordingDuration);
                }
                else if (name == "commandRecordNow[title]") {
                    recordingTitle = parameterValue;
                    console.log("title=" + recordingTitle);

                    // hack? title is the last parameter so post message now
                    var event = {}
                    event["EventType"] = "RECORD_NOW";
                    event["Title"] = recordingTitle;
                    event["Duration"] = recordingDuration;
                    postMessage(event);
                }
            }
            else if (name == "bsMessage") {
                var command$ = msg.data[name].toLowerCase();
                if (command$ == "updateprogressbar" && $("#progressBar").length) {

                    console.log("UPDATEPROGRESSBAR ********************************************************");
                    // currentOffset in seconds
                    var currentOffset = msg.data["currentOffset"];
                    console.log('### currentOffset : ' + currentOffset);

                    // duration in seconds
                    var recordingDuration = msg.data["recordingDuration"];
                    console.log('### recordingDuration : ' + recordingDuration);

                    var event = {}
                    event["EventType"] = "UPDATE_PROGRESS_BAR";
                    event["Offset"] = currentOffset;
                    event["Duration"] = recordingDuration;
                    postMessage(event);

                    return;
                }
                else if (command$ == "mediaend") {
                    console.log("MEDIA_END ********************************************************");
                    var event = {}
                    event["EventType"] = "MEDIA_END";
                    postMessage(event);
                }
            }
        }
    }
}