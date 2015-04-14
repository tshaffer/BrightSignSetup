var sendConsoleOutputToBS = true;

// BrightSign only
var bsMessage;
var ir_receiver;

// miscellaneous variables
var _showRecordingId;

var modalDialogDisplayed = false;
var selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
var unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

function consoleLog(msg) {
    console.log(msg);
    if (sendConsoleOutputToBS) {
        if (typeof bsMessage == 'object') {
            bsMessage.PostBSMessage({ command: "debugPrint", "debugMessage": msg });
        }
    }
}

// BrightSign specific functionality
// delete dialog - BrightSign only for now
function displayDeleteShowDlg(showTitle, showRecordingId) {

    consoleLog("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", showRecordingId=" + showRecordingId);

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
    consoleLog("deleteShowDlgCloseInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    //switchToPage("homePage");
}

function deleteShowDlgDeleteInvoked() {
    consoleLog("deleteShowDlgDeleteInvoked");
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
    consoleLog("hours = " + hours);

    var minutes = Math.floor((Number(numSeconds) / 60) % 60).toString();
    minutes = twoDigitFormat(minutes);
    consoleLog("minutes = " + minutes);

    return hours + ":" + minutes;
}


// currently unused
//function togglePlayIcon() {
//    consoleLog("script.js:: togglePlayIcon invoked");
//    if (!$("#playIcon").length) {
//        consoleLog("script.js:: display play icon");
//        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
//        $("#videoControlRegion").append(toAppend);
//    } else {
//        consoleLog("script.js:: remove play icon");
//        $("#playIcon").remove();
//    }
//}

function executeRemoteCommand(remoteCommand) {
    consoleLog("executeRemoteCommand:" + remoteCommand);
    bsMessage.PostBSMessage({ command: "remoteCommand", "remoteCommand": remoteCommand });
}


function executeDeleteSelectedShow(recordingId) {

    consoleLog("executeDeleteSelectedShow " + recordingId);

    bsMessage.PostBSMessage({ command: "deleteRecordedShow", "recordingId": recordingId });
}


function initializeBrightSign() {

    var lastRemoteEventTime = 0;

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
        consoleLog("unable to create ir_receiver");
    }

    consoleLog("typeof ir_receiver is " + typeof ir_receiver);

    if (typeof ir_receiver != 'undefined') {
        ir_receiver.onremotedown = function (e) {
            consoleLog('############ onremotedown: ' + e.irType + " - " + e.code);
            consoleLog('############ onremotedown: remoteCommand=' + GetRemoteCommand(e.code));

            // debounce remote
            var now = new Date();
            var msSinceLastCommand = now - lastRemoteEventTime;
            consoleLog("msSinceLastCommand=" + msSinceLastCommand);
            if (msSinceLastCommand > 400) {
                lastRemoteEventTime = now;

                var event = {};
                event["EventType"] = "REMOTE";
                event["EventData"] = GetRemoteCommand(e.code);
                postMessage(event);
            }
            else {
                consoleLog("ignore extraneous remote input");
            }
        }

        ir_receiver.onremoteup = function (e) {
            consoleLog('############ onremoteup: ' + e.irType + " - " + e.code);
        }
    }

    // message port for getting messages from the BrightSign via roMessagePort
    bsMessage = new BSMessagePort();
    consoleLog("typeof bsMessage is " + typeof bsMessage);
    bsMessage.PostBSMessage({ message: "javascript ready" });

    bsMessage.onbsmessage = function (msg) {
        consoleLog("onbsmessage invoked");

        var message = {};

        for (name in msg.data) {
            consoleLog('### ' + name + ': ' + msg.data[name]);
            message[name] = msg.data[name];
        }

        var event = {};

        switch (message.command) {
            case "setIPAddress":
                var brightSignIPAddress = message.value;
                $("#ipAddress").html("ip address: " + brightSignIPAddress);
                baseURL = "http://" + brightSignIPAddress + ":8080/";
                consoleLog("baseURL from BrightSign message is: " + baseURL);

                // post message indicating that initialization is complete ??
                event["EventType"] = "READY";
                postMessage(event);
                break;
            case "remoteCommand":
                var event = {};
                event["EventType"] = "REMOTE";
                event["EventData"] = message.value;
                postMessage(event);
                break;
            case "recordings":
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
            case "deleteRecordedShow":
                event["EventType"] = "DELETE_RECORDED_SHOW";
                event["EventData"] = msg.data[name];
                postMessage(event);
                break;
            case "recordNow":
                event["EventType"] = "RECORD_NOW";
                event["Title"] = message.title;
                event["Duration"] = message.duration;
                event["UseTuner"] = message.useTuner;
                event["Channel"] = message.channel;
                postMessage(event);
                break;
            case "manualRecord":
                event["EventType"] = "SET_MANUAL_RECORD";
                event["DateTime"] = message.dateTime;
                event["Title"] = message.title;
                event["Duration"] = message.duration;
                event["UseTuner"] = message.useTuner;
                event["Channel"] = message.channel;
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
        }
    }
}