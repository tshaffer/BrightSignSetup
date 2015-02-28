var baseURL;

// BrightSign only
var bsMessage;
var ir_receiver;


// miscellaneous variables
var _showRecordingId;

var modalDialogDisplayed = false;
var selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
var unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

// BrightSign specific functionality
function navigateRecordedShowsPage(navigationCommand$) {

    console.log("navigateRecordedShowsPage entry");

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    if (currentElementId == "" || currentElementId == "recordedShows") {
        rowIndex = 0;
        colIndex = 0;
    }
    else {
        currentElementId = "#" + currentElementId;
        for (i = 0; i < recordedPageIds.length; i++) {

            var recordingId = recordedPageIds[i][0];
            var deleteId = recordedPageIds[i][1];

            if (recordingId == currentElementId) {
                rowIndex = i;
                colIndex = 0;
                break;
            }
            else if (deleteId == currentElementId) {
                rowIndex = i;
                colIndex = 1;
                break;
            }
        }

        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < recordedPageIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < 1) colIndex++;
                break;
        }
    }

    $(recordedPageIds[rowIndex][colIndex]).focus();
}

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
    switchToPage("homePage");
}

function deleteShowDlgDeleteInvoked() {
    console.log("deleteShowDlgDeleteInvoked");
    $('#deleteShowDlg').modal('hide');
    modalDialogDisplayed = false;
    executeDeleteSelectedShow(_showRecordingId);
    switchToPage("homePage");
}

// home page
var mainMenuIds = [
    ['recordedShows', 'setManualRecord'],
    ['channelGuide', 'userSelection'],
    ['toDoList', 'myPlayVideo']
];

function navigateHomePage(navigationCommand$) {

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    for (i = 0; i < mainMenuIds.length; i++) {
        for (j = 0; j < mainMenuIds[i].length; j++) {
            if (mainMenuIds[i][j] == currentElementId) {
                rowIndex = i;
                colIndex = j;
                break;
            }
            // break again if necessary?
        }
    }

    if (rowIndex >= 0 && colIndex >= 0) {
        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < mainMenuIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < mainMenuIds[0].length) colIndex++;
                break;
        }
    }
    else {
        rowIndex = 0;
        colIndex = 0;
    }

    console.log("currentElementId is " + currentElementId);

    var newElementId = "#" + mainMenuIds[rowIndex][colIndex];

    $("#" + currentElementId).removeClass("btn-primary");
    $("#" + currentElementId).addClass("btn-secondary");

    $(newElementId).removeClass("btn-secondary");
    $(newElementId).addClass("btn-primary");

    $(newElementId).focus();
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
    // Create displayEngine state machine
    displayEngineHSM = new displayEngineStateMachine();
    registerStateMachine(displayEngineHSM);
    displayEngineHSM.Initialize();

    // Create recordingEngine state machine
    recordingEngineHSM = new recordingEngineStateMachine();
    registerStateMachine(recordingEngineHSM);
    recordingEngineHSM.Initialize();

    // ir receiver
    ir_receiver = new BSIRReceiver("Iguana", "NEC");
    console.log("typeof ir_receiver is " + typeof ir_receiver);

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