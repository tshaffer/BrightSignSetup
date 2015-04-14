// send trick commands to device for boomerang back to JS to state machine
function sendRemoteCommandToDevice(remoteCommand) {

    console.log("sendRemoteCommandToDevice: " + remoteCommand);

    var aUrl = baseURL + "browserCommand";
    var commandData = { "command": "remoteCommand", "value": remoteCommand };
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

function remoteRecord() {
    console.log("remoteRecord invoked");
}

function recordNow() {

    // get current date/time - used as title if user doesn't provide one.
    var currentDate = new Date();

    var duration = $("#recordNowDuration").val();
    var useTuner = $("#recordNowTuneCheckbox").is(':checked');
    var channel = $("#recordNowChannel").val();

    var title = getRecordingTitle("#recordNowTitle", currentDate, false, "");

    var aUrl = baseURL + "browserCommand";
    var commandData = { "command": "recordNow", "duration": duration, "title": title, "channel": channel, "useTuner": useTuner };
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

function createManualRecording() {

    // retrieve date/time from html elements and convert to a format that works on all devices
    var date = $("#manualRecordDate").val();
    var time = $("#manualRecordTime").val();
    var dateTimeStr = date + " " + time;

    // required for iOS devices - http://stackoverflow.com/questions/13363673/javascript-date-is-invalid-on-ios
    var compatibleDateTimeStr = dateTimeStr.replace(/-/g, '/');

    var dateObj = new Date(compatibleDateTimeStr);

    var duration = $("#manualRecordDuration").val();
    var useTuner = $("#manualRecordTuneCheckbox").is(':checked');
    var channel = $("#manualRecordChannel").val();

    // check to see if recording is in the past
    var dtEndOfRecording = addMinutes(dateObj, duration);
    var now = new Date();

    var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
    if (millisecondsUntilEndOfRecording < 0) {
        alert("Recording time is in the past - change the date/time and try again.");
        return;
    }

    var title = getRecordingTitle("#manualRecordTitle", dateObj, useTuner, channel);

    var aUrl = baseURL + "browserCommand";
    var commandData = { "command": "manualRecord", "dateTime": compatibleDateTimeStr, "duration": duration, "title": title, "channel": channel, "useTuner": useTuner };
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
    var commandData = { "command": "playRecordedShow", "recordingId": recordingId };
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
    //var commandData = { "commandDeleteRecordedShow": recordingId };
    var commandData = { "command": "deleteRecordedShow", "recordingId": recordingId };
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

function playSelectedShowFromBeginning(event) {
}

function streamSelectedShow(event) {

    var hlsUrl = event.data.hlsUrl;
    if (typeof hlsUrl != "undefined" && hlsUrl != "") {
        var streamingUrl = baseIP + ":8088/file://" + hlsUrl;
        var win = window.open(streamingUrl, '_blank');
        win.focus();
    }
    else {
        alert("Unable to stream this recording.");
    }
}
