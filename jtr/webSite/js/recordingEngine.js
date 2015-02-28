function recordingEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeRecordingEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stRecordingController = new HState(this, "RecordingController");
    this.stRecordingController.HStateEventHandler = this.STRecordingControllerEventHandler;
    this.stRecordingController.superState = this.stTop;

    this.stIdle = new HState(this, "Idle");
    this.stIdle.HStateEventHandler = this.STIdleEventHandler;
    this.stIdle.superState = this.stRecordingController;

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
    else if (event["EventType"] == "ADD_MANUAL_RECORD") {
        //m.AddManualRecord(event["Title"], event["Channel"], event["DateTime"], event["Duration"], event["UseTuner"])
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
        bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });

        return "HANDLED"
    }

    stateData.nextState = this.superState;
    return "SUPER";
}