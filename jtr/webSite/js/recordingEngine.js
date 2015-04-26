function recordingEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeRecordingEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stRecordingController = new HState(this, "RecordingController");
    this.stRecordingController.HStateEventHandler = this.STRecordingControllerEventHandler;
    this.stRecordingController.superState = this.stTop;
    this.stRecordingController.addRecording = this.addRecording;
    this.stRecordingController.startRecordingTimer = this.startRecordingTimer;
    this.stRecordingController.recordingObsolete = this.recordingObsolete;

    this.stIdle = new HState(this, "Idle");
    this.stIdle.HStateEventHandler = this.STIdleEventHandler;
    this.stIdle.superState = this.stRecordingController;
    this.stIdle.addRecording = this.addRecording;
    this.stIdle.startRecordingTimer = this.startRecordingTimer;
    this.stIdle.recordingObsolete = this.recordingObsolete;
    this.stIdle.deleteScheduledRecording = this.deleteScheduledRecording;
    this.stIdle.handleSetManualRecord = this.handleSetManualRecord;

    this.stRecording = new HState(this, "Recording");
    this.stRecording.HStateEventHandler = this.STRecordingEventHandler;
    this.stRecording.superState = this.stRecordingController;
    this.stRecording.startRecording = this.startRecording;
    this.stRecording.addRecordingEndTimer = this.addRecordingEndTimer;
    this.stRecording.endRecording = this.endRecording;
    this.stRecording.recordingObsolete = this.recordingObsolete;
    this.stRecording.addRecording = this.addRecording;
    this.stRecording.startRecordingTimer = this.startRecordingTimer;
    this.stRecording.handleSetManualRecord = this.handleSetManualRecord;

    this.topState = this.stTop;
}

//subclass extends superclass
recordingEngineStateMachine.prototype = Object.create(HSM.prototype);
recordingEngineStateMachine.prototype.constructor = recordingEngineStateMachine;


recordingEngineStateMachine.prototype.InitializeRecordingEngineHSM = function () {

    consoleLog("InitializeRecordingEngineHSM invoked");
    return this.stIdle;
}


recordingEngineStateMachine.prototype.STRecordingControllerEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.STIdleEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "READY") {
        consoleLog(this.id + ": READY message received");

        // get scheduled recordings from db
        var aUrl = baseURL + "getScheduledRecordings";

        var thisObj = this;

        $.get(aUrl, {})
            .done(function (result) {
                consoleLog("getScheduledRecordings success");

                var thisThisObj = thisObj;

                $.each(result.scheduledrecordings, function (index, scheduledRecording) {
                    consoleLog(scheduledRecording.DateTime + " " + scheduledRecording.Channel + " " + scheduledRecording.Duration + " " + scheduledRecording.Id + " " + scheduledRecording.Title + " " + scheduledRecording.UseTuner);

                    // if the recording is in the past, remove if from the db
                    var recordingObsolete = thisThisObj.recordingObsolete(scheduledRecording.DateTime, scheduledRecording.Duration);
                    consoleLog("recordingObsolete = " + recordingObsolete);
                    if (recordingObsolete) {
                        thisThisObj.deleteScheduledRecording(scheduledRecording.Id);
                    }
                    else {
                        var actualDuration = {};
                        actualDuration.durationInMS = scheduledRecording.Duration;
                        var recordNow = thisThisObj.addRecording(false, scheduledRecording.DateTime, scheduledRecording.Title, scheduledRecording.Duration, scheduledRecording.UseTuner, scheduledRecording.Channel, actualDuration, false);
                        if (recordNow) {

                            // post internal message to cause transition to recording state
                            var event = {};
                            event["EventType"] = "TRANSITION_TO_RECORDING";
                            thisThisObj.stateMachine.recordingTitle = scheduledRecording.Title;
                            thisThisObj.stateMachine.recordingDuration = actualDuration.durationInMS;
                            thisThisObj.stateMachine.recordingUseTuner = scheduledRecording.UseTuner;
                            thisThisObj.stateMachine.recordingChannel = scheduledRecording.Channel;
                            postMessage(event);
                        }
                    }
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                consoleLog("getScheduledRecordings failure");
            })
            .always(function () {
                //alert("recording transmission finished");
            });

        return "HANDLED";
    }
    else if (event["EventType"] == "TRANSITION_TO_RECORDING") {
        consoleLog("TRANSITION_TO_RECORDING event received");
        stateData.nextState = this.stateMachine.stRecording;
        return "TRANSITION";
    }
    else if (event["EventType"] == "RECORD_NOW") {
        this.stateMachine.recordingTitle = event["Title"];
        this.stateMachine.recordingDuration = Number(event["Duration"]) * 60000;
        this.stateMachine.recordingUseTuner = false;
        if (event["UseTuner"] == "true") {
            this.stateMachine.recordingUseTuner = true;
        }
        this.stateMachine.recordingChannel = event["Channel"];

        consoleLog("STIdleEventHandler: RECORD_NOW received. Title = " + this.stateMachine.recordingTitle + ", duration = " + this.stateMachine.recordingDuration + ", useTuner = " + this.stateMachine.recordingUseTuner + ", channel = " + this.stateMachine.recordingChannel);

        stateData.nextState = this.stateMachine.stRecording;
        return "TRANSITION";
    }
    else if (event["EventType"] == "SET_MANUAL_RECORD") {
        return this.handleSetManualRecord(event, true);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.handleSetManualRecord = function (event, idle) {

    var dateTime = event["DateTime"];
    var title = event["Title"];
    var duration = event["Duration"];
    var useTuner = false;
    if (event["UseTuner"] == "true") {
        useTuner = true;
    }
    var channel = event["Channel"];

    consoleLog("handleSetManualRecord: SET_MANUAL_RECORD received. DateTime = " + dateTime + ", title = " + title + ", duration in minutes = " + duration + ", useTuner = " + useTuner + ", channel = " + channel);

    // ignore manual recordings that are in the past
    var durationInMilliseconds = Number(duration) * 60000;
    var recordingObsolete = this.recordingObsolete(dateTime, durationInMilliseconds);
    if (recordingObsolete) {
        consoleLog("Manual recording in the past, ignore request.");
        return "HANDLED";
    }

    var actualDuration = {};
    actualDuration.durationInMS = durationInMilliseconds;

    if (idle) {
        var recordNow = this.addRecording(true, dateTime, title, durationInMilliseconds, useTuner, channel, actualDuration, true);
        if (recordNow) {
            this.stateMachine.recordingTitle = title;
            this.stateMachine.recordingDuration = actualDuration.durationInMS;
            this.stateMachine.recordingUseTuner = useTuner;
            this.stateMachine.recordingChannel = channel;
            stateData.nextState = this.stateMachine.stRecording;
            return "TRANSITION";
        }
    }
    else {
        var recordNow = this.addRecording(true, dateTime, title, durationInMilliseconds, useTuner, channel, actualDuration, false);
        if (recordNow) {
            consoleLog("SetManualRecord indicates record now!! Reject: recording in progress");
        }
    }

    return "HANDLED"

}

recordingEngineStateMachine.prototype.STRecordingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    console.log("STRecordingEventHandler: event=" + event["EventType"]);

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.startRecording(this.stateMachine.recordingTitle, this.stateMachine.recordingDuration, this.stateMachine.recordingUseTuner, this.stateMachine.recordingChannel);
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "RECORD_NOW" || event["EventType"] == "TRANSITION_TO_RECORDING") {
        // TODO - display error message?
        consoleLog("RECORD_NOW received and rejected: recording in progress");
        return "HANDLED";
    }
    else if (event["EventType"] == "TRANSITION_TO_IDLE") {
        stateData.nextState = this.stateMachine.stIdle;
        return "TRANSITION";
    }
    else if (event["EventType"] == "SET_MANUAL_RECORD") {
        return this.handleSetManualRecord(event, false);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.addRecording = function (addToDB, dateTime, title, duration, useTuner, channel, actualDuration, addToDBIfAlreadyActive) {

    var recordNow;

    var dtStartOfRecording = new Date(dateTime);
    var now = new Date();
    var millisecondsUntilRecording = dtStartOfRecording - now;

    if (millisecondsUntilRecording < 0) {
        recordNow = true;
        actualDuration.durationInMS = actualDuration.durationInMS + millisecondsUntilRecording;
    }
    else {
        this.startRecordingTimer(millisecondsUntilRecording, title, duration, useTuner, channel);
        recordNow = false;
    }

    if (addToDB && (addToDBIfAlreadyActive || !recordNow)) {
        var aUrl = baseURL + "addScheduledRecording";
        var recordingData = { "dateTime": dateTime, "title": title, "duration": duration, "useTuner": useTuner, "channel": channel };

        var thisObj = this;

        $.get(aUrl, recordingData)
            .done(function (result) {
                consoleLog("addScheduledRecording successfully sent");
                var scheduledRecordingId = Number(result);
                consoleLog("scheduledRecordingId=" + scheduledRecordingId);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                consoleLog("addScheduledRecording failure");
            })
            .always(function () {
                //alert("recording transmission finished");
            });
    }

    return recordNow;
}


// TODO - save this in case user wants to cancel a recording?
var timerVar;

recordingEngineStateMachine.prototype.startRecordingTimer = function (millisecondsUntilRecording, title, duration, useTuner, channel) {
    consoleLog("startRecordingTimer - start timer: millisecondsUntilRecording=" + millisecondsUntilRecording);
    var thisObj = this;
    // when timeout occurs, setup variables and send message indicating a transition to recording state
    timerVar = setTimeout(function ()
    {
        consoleLog("startRecordingTimer: timeout");

        thisObj.stateMachine.recordingTitle = title;
        thisObj.stateMachine.recordingDuration = duration;
        thisObj.stateMachine.recordingUseTuner = useTuner;
        thisObj.stateMachine.recordingChannel = channel;
        var event = {};
        event["EventType"] = "TRANSITION_TO_RECORDING";
        postMessage(event);
    }
    , millisecondsUntilRecording);
}


recordingEngineStateMachine.prototype.startRecording = function (title, duration, useTuner, channel) {

    consoleLog("startRecording: title=" + title + ", duration=" + duration + ", useTuner=" + useTuner + ",channel=" + channel);

    if (!useTuner) {
        consoleLog("No tuner: Title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel);
    }
    else {
        if (ir_transmitter == null) {
            ir_transmitter = new BSIRTransmitter("IR-out");
        }

        tuneChannel(channel, false);
    }

    bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
    this.addRecordingEndTimer(duration, title, new Date(), duration);
    displayUserMessage("Recording started: " + title);
}


// TODO - save this in case user wants to stop a recording?
var endOfRecordingTimer;
recordingEngineStateMachine.prototype.addRecordingEndTimer = function (durationInMilliseconds, title, dateTime, duration) {
    consoleLog("addRecordingEndTimer - start timer: duration=" + durationInMilliseconds);
    var thisObj = this;
    endOfRecordingTimer = setTimeout(function () {
        consoleLog("addRecordingEndTimer - endOfRecordingTimer triggered");
        thisObj.endRecording(title, dateTime, duration);
    }, durationInMilliseconds);
}


recordingEngineStateMachine.prototype.endRecording = function (title, dateTime, duration) {
    consoleLog("endRecording: title = " + title + ", dateTime = " + dateTime + ", duration = " + duration);

    // Set fileName from date/time
    //var fileName = (new Date()).toISOString();
    //consoleLog("isoDateString = " + fileName);
    //fileName = fileName.replace(/-/gi, "");
    //consoleLog("fileName = " + fileName);
    //fileName = fileName.replace(/:/gi, "");
    //consoleLog("fileName = " + fileName);
    //fileName = fileName.replace(/Z/gi, "");
    //consoleLog("fileName = " + fileName);
    //fileName = fileName.slice(0, 15);
    //consoleLog("fileName = " + fileName);

    bsMessage.PostBSMessage({ command: "endRecording", startSegmentation: true });

    var event = {};
    event["EventType"] = "TRANSITION_TO_IDLE";
    postMessage(event);
}


// ignore manual recordings that are in the past
recordingEngineStateMachine.prototype.recordingObsolete = function (startDateTime, durationInMilliseconds) {
    var dtStartOfRecording = new Date(startDateTime);
    var dtEndOfRecording = addMilliseconds(dtStartOfRecording, durationInMilliseconds);
    var now = new Date();
    var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
    return millisecondsUntilEndOfRecording < 0;
}


recordingEngineStateMachine.prototype.deleteScheduledRecording = function (scheduledRecordingId) {

    var aUrl = baseURL + "deleteScheduledRecording";
    var recordingId = { "id": scheduledRecordingId };

    $.get(aUrl, recordingId)
        .done(function (result) {
            consoleLog("deleteScheduledRecording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("deleteScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}

