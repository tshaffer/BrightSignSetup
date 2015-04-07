﻿function recordingEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeRecordingEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stRecordingController = new HState(this, "RecordingController");
    this.stRecordingController.HStateEventHandler = this.STRecordingControllerEventHandler;
    this.stRecordingController.superState = this.stTop;
    this.stRecordingController.recordingObsolete = this.recordingObsolete;
    this.stRecordingController.deleteScheduledRecording = this.deleteScheduledRecording;
    this.stRecordingController.addRecording = this.addRecording;
    this.stRecordingController.setRecording = this.setRecording;
    this.stRecordingController.startRecording = this.startRecording;
    this.stRecordingController.startRecordingTimer = this.startRecordingTimer;
    this.stRecordingController.addRecordingEndTimer = this.addRecordingEndTimer;
    this.stRecordingController.endRecording = this.endRecording;
    
    this.stIdle = new HState(this, "Idle");
    this.stIdle.HStateEventHandler = this.STIdleEventHandler;
    this.stIdle.superState = this.stRecordingController;
    this.stIdle.startRecording = this.startRecording;
    this.stIdle.startRecordingTimer = this.startRecordingTimer;
    this.stIdle.recordingObsolete = this.recordingObsolete;
    this.stIdle.addRecording = this.addRecording;
    this.stIdle.setRecording = this.setRecording;
    this.stIdle.addRecordingEndTimer = this.addRecordingEndTimer;
    this.stIdle.endRecording = this.endRecording;

    this.stRecording = new HState(this, "Recording");
    this.stRecording.HStateEventHandler = this.STRecordingEventHandler;
    this.stRecording.superState = this.stRecordingController;

    this.stSegmentingHLS = new HState(this, "SegmentingHLS");
    this.stSegmentingHLS.HStateEventHandler = this.STSegmentingHLSEventHandler;
    this.stSegmentingHLS.superState = this.stRecordingController;

    this.topState = this.stTop;
}

//subclass extends superclass
recordingEngineStateMachine.prototype = Object.create(HSM.prototype);
recordingEngineStateMachine.prototype.constructor = recordingEngineStateMachine;


recordingEngineStateMachine.prototype.deleteScheduledRecording = function (scheduledRecordingId) {

    var aUrl = baseURL + "deleteScheduledRecording";
    var recordingId = { "id": scheduledRecordingId };

    $.get(aUrl, recordingId)
        .done(function (result) {
            console.log("deleteScheduledRecording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("deleteScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


recordingEngineStateMachine.prototype.InitializeRecordingEngineHSM = function () {

    console.log("InitializeRecordingEngineHSM invoked");
    return this.stIdle;
}


recordingEngineStateMachine.prototype.STRecordingControllerEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "READY") {
        console.log(this.id + ": READY message received");

        // get scheduled recordings from db
        var aUrl = baseURL + "getScheduledRecordings";

        var thisObj = this;

        $.get(aUrl, {})
            .done(function (result) {
                console.log("getScheduledRecordings successfully sent");

                var thisThisObj = thisObj;

                $.each(result.scheduledrecordings, function (index, scheduledRecording) {
                    console.log(scheduledRecording.DateTime + " " + scheduledRecording.Channel + " " + scheduledRecording.Duration + " " + scheduledRecording.Id + " " + scheduledRecording.Title + " " + scheduledRecording.UseTuner);

                    // if the recording is in the past, remove if from the db
                    var recordingObsolete = thisThisObj.recordingObsolete(scheduledRecording.DateTime, Number(scheduledRecording.Duration));
                    console.log("recordingObsolete = " + recordingObsolete);
                    if (recordingObsolete) {
                        thisThisObj.deleteScheduledRecording(scheduledRecording.Id);
                    }
                    else {
                        thisThisObj.addRecording(false, scheduledRecording.DateTime, scheduledRecording.Title, scheduledRecording.Duration, scheduledRecording.UseTuner, scheduledRecording.Channel);
                    }
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                console.log("getScheduledRecordings failure");
            })
            .always(function () {
                //alert("recording transmission finished");
            });

    }
    else if (event["EventType"] == "ADD_MANUAL_RECORD") {
        //m.AddManualRecord(event["Title"], event["Chdannel"], event["DateTime"], event["Duration"], event["UseTuner"])
        return "HANDLED"
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.STIdleEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "RECORD_NOW") {
        var title = event["Title"];
        var duration = event["Duration"];
        console.log("STIdleEventHandler: RECORD_NOW received. Title = " + title + ", duration = " + duration);
        //bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration, "useTuner": "false", "channel": "HDMI-In" });

        this.addRecording(false, new Date(), title, duration, false, channel);

        return "HANDLED"
    }
    else if (event["EventType"] == "SET_MANUAL_RECORD") {

        var dateTime = event["DateTime"];
        var title = event["Title"];
        var duration = event["Duration"];
        var useTuner = false;
        if (event["UseTuner"] == "true") {
            useTuner = true;
        }
        var channel = event["Channel"];

        console.log("STIdleEventHandler: SET_MANUAL_RECORD received. DateTime = " + dateTime + ", title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel);

        // ignore manual recordings that are in the past
        var recordingObsolete = this.recordingObsolete(dateTime, Number(duration));
        if (recordingObsolete) {
            console.log("Manual recording in the past, ignore request.");
            return;
        }

        this.addRecording(true, dateTime, title, duration, useTuner, channel);

        return "HANDLED"
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.addRecording = function (addToDB, dateTime, title, duration, useTuner, channel) {

    var dtStartOfRecording = new Date(dateTime);
    var now = new Date();
    var millisecondsUntilRecording = dtStartOfRecording - now;

    if (addToDB) {
        var aUrl = baseURL + "addScheduledRecording";
        var recordingData = { "dateTime": dateTime, "title": title, "duration": duration, "useTuner": useTuner, "channel": channel };

        var thisObj = this;

        $.get(aUrl, recordingData)
            .done(function (result) {
                console.log("addScheduledRecording successfully sent");
                var scheduledRecordingId = Number(result);
                console.log("scheduledRecordingId=" + scheduledRecordingId);
                thisObj.setRecording(millisecondsUntilRecording, title, duration, useTuner, channel);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                console.log("addScheduledRecording failure");
            })
            .always(function () {
                //alert("recording transmission finished");
            });
    }
    else {
        this.setRecording(millisecondsUntilRecording, title, duration, useTuner, channel);
    }
}


recordingEngineStateMachine.prototype.setRecording = function (millisecondsUntilRecording, title, duration, useTuner, channel) {

    // check to see if recording should begin immediately
    if (millisecondsUntilRecording < 0) {
        console.log("start recording now");
        this.startRecording(title, duration, useTuner, channel);
    }
    else {
        this.startRecordingTimer(millisecondsUntilRecording, title, duration, useTuner, channel);
    }
}

// ignore manual recordings that are in the past
recordingEngineStateMachine.prototype.recordingObsolete = function (startDateTime, durationInMinutes) {
    var dtStartOfRecording = new Date(startDateTime);
    var dtEndOfRecording = addMinutes(dtStartOfRecording, durationInMinutes);
    var now = new Date();
    var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
    return millisecondsUntilEndOfRecording < 0;
}

// TODO - save this in case user wants to cancel a recording?
var timerVar;

recordingEngineStateMachine.prototype.startRecordingTimer = function (millisecondsUntilRecording, title, duration, useTuner, channel) {
    console.log("startRecordingTimer - start timer");
    var thisObj = this;
    timerVar = setTimeout(function () { thisObj.startRecording(title, duration, useTuner, channel); }, millisecondsUntilRecording);
}

recordingEngineStateMachine.prototype.startRecording = function (title, duration, useTuner, channel) {

    if (!useTuner) {
        console.log("No tuner: Title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel);
        bsMessage.PostBSMessage({ command: "debugPrint", "debugMessage": "No tuner: Title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel });

        bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
        this.addRecordingEndTimer(Number(duration) * 60 * 1000, title, new Date(), duration);
    }
    else {
        var ir_transmitter = new BSIRTransmitter("IR-out");
        console.log("typeof ir_transmitter is " + typeof ir_transmitter);

        var irCode = -1;

        switch (channel) {
            case "2":
                irCode = 65360;
                break;
            case "4":
                irCode = 65367;
                break;
            case "5":
                irCode = 65364;
                break;
            case "7":
                irCode = 65359;
                break;
            case "9":
                irCode = 65292;
                break;
            case "11":
                irCode = 65363;
                ir_transmitter.Send("NEC", irCode);
                setTimeout(function () {
                    console.log("send second digit");
                    ir_transmitter.Send("NEC", irCode);

                    console.log("Tuner (double digit): Title = " + title + ", duration = " + duration, ", useTuner = " + useTuner + ", channel = " + channel);
                    bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
                },
                400);
                break;
        }

        if (irCode > 0) {
            ir_transmitter.Send("NEC", irCode);

            console.log("Tuner (single digit): Title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel);
            bsMessage.PostBSMessage({ command: "debugPrint", "debugMessage": "Tuner (single digit): Title = " + title + ", duration = " + duration + ", useTuner = " + useTuner + ", channel = " + channel });

            bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
        }
        else {
            return;
        }
        return;
    }
}

// TODO - save this in case user wants to stop a recording?
var endOfRecordingTimer;
recordingEngineStateMachine.prototype.addRecordingEndTimer = function (durationInMilliseconds, title, dateTime, duration) {
    console.log("addRecordingEndTimer - start timer");
    var thisObj = this;
    endOfRecordingTimer = setTimeout(function () { thisObj.endRecording(title, dateTime, duration); }, durationInMilliseconds);
}

recordingEngineStateMachine.prototype.endRecording = function (title, dateTime, duration) {
    console.log("endRecording: title = " + title + ", dateTime = " + dateTime + ", duration = " + duration);

    // Set fileName from date/time
    //var fileName = (new Date()).toISOString();
    //console.log("isoDateString = " + fileName);
    //fileName = fileName.replace(/-/gi, "");
    //console.log("fileName = " + fileName);
    //fileName = fileName.replace(/:/gi, "");
    //console.log("fileName = " + fileName);
    //fileName = fileName.replace(/Z/gi, "");
    //console.log("fileName = " + fileName);
    //fileName = fileName.slice(0, 15);
    //console.log("fileName = " + fileName);

    bsMessage.PostBSMessage({ command: "endRecording", startSegmentation: true });

}
