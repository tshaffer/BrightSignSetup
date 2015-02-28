// send trick commands to device for boomerang back to JS to state machine
function sendRemoteCommandToDevice(remoteCommand) {

    console.log("sendRemoteCommandToDevice: " + remoteCommand);

    var aUrl = baseURL + "browserCommand";
    var commandData = { "remoteCommand": remoteCommand };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}

function remotePause() {
    sendRemoteCommandToDevice("pause");
}

function remotePlay() {
    sendRemoteCommandToDevice("play");
}

function remoteRewind() {
    sendRemoteCommandToDevice("rewind");
}

function remoteFastForward() {
    sendRemoteCommandToDevice("fastForward");
}

function remoteInstantReplay() {
    sendRemoteCommandToDevice("instantReplay");
}

function remoteQuickSkip() {
    sendRemoteCommandToDevice("quickSkip");
}

function remoteStop() {
    sendRemoteCommandToDevice("stop");
}


function recordNow() {

    // get current date/time - used as title if user doesn't provide one.
    var currentDate = new Date();

    var title = getRecordingTitle(currentDate, false, "");

    var duration = $("#manualRecordDuration").val();

    var recordData = { "duration": duration, "title": title }

    var aUrl = baseURL + "browserCommand";
    var commandData = { "commandRecordNow": recordData };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


function playSelectedShow(event) {

    var recordingId = event.data.recordingId;

    // unused?
    //if (recordingId in _currentRecordings) {
    //    var selectedRecording = _currentRecordings[recordingId];
    //}

    var aUrl = baseURL + "browserCommand";
    //var recordingData = { "command": "playRecordedShow", "commandData": recordingId };
    var commandData = { "commandPlayRecordedShow": recordingId };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


function deleteSelectedShow(event) {
    var recordingId = event.data.recordingId;

    var aUrl = baseURL + "browserCommand";
    var commandData = { "commandDeleteRecordedShow": recordingId };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand successfully sent");
            getRecordedShows();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}

