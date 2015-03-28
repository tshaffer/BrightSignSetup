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
        bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration, "useTuner": "false", "channel": "HDMI-In" });

        return "HANDLED"
    }
    else if (event["EventType"] == "SET_MANUAL_RECORD") {

        var dateTime = event["DateTime"];
        var title = event["Title"];
        var duration = event["Duration"];
        var useTuner = event["UseTuner"];
        var channel = event["Channel"];

        console.log("STIdleEventHandler: SET_MANUAL_RECORD received. DateTime = " + dateTime + ", title = " + title + ", duration = " + duration, ", useTuner = " + useTuner + ", channel = " + channel);

        var now = new Date();
        var millisecondsUntilRecording = new Date(dateTime) - now;
        setTimeout(function () {

            console.log("manual recording timeout");

            if (!useTuner) {
                console.log("No tuner: Title = " + title + ", duration = " + duration, ", useTuner = " + useTuner + ", channel = " + channel);
                bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
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

                    console.log("Tuner (single digit): Title = " + title + ", duration = " + duration, ", useTuner = " + useTuner + ", channel = " + channel);
                    bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": duration });
                }
                else {
                    return;
                }
                return;
            }
        },
        millisecondsUntilRecording);

        return "HANDLED"
    }

    stateData.nextState = this.superState;
    return "SUPER";
}