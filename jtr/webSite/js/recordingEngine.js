function recordingEngineStateMachine() {

    this.firstTime = true;
    this.toDoList = [];
    this.timerVar = null;

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeRecordingEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stRecordingController = new HState(this, "RecordingController");
    this.stRecordingController.HStateEventHandler = this.STRecordingControllerEventHandler;
    this.stRecordingController.superState = this.stTop;
    this.stRecordingController.executeStartRecording = this.executeStartRecording;
    this.stRecordingController.recordingObsolete = this.recordingObsolete;

    this.stIdle = new HState(this, "Idle");
    this.stIdle.HStateEventHandler = this.STIdleEventHandler;
    this.stIdle.superState = this.stRecordingController;
    this.stIdle.toDoListBuiltOnStartup = this.toDoListBuiltOnStartup;
    this.stIdle.executeStartRecording = this.executeStartRecording;
    this.stIdle.recordingObsolete = this.recordingObsolete;
    this.stIdle.deleteScheduledRecording = this.deleteScheduledRecording;
    this.stIdle.handleAddRecord = this.handleAddRecord;
    this.stIdle.addToDB = this.addToDB;

    this.stRecording = new HState(this, "Recording");
    this.stRecording.HStateEventHandler = this.STRecordingEventHandler;
    this.stRecording.superState = this.stRecordingController;
    this.stRecording.startRecording = this.startRecording;
    this.stRecording.addRecordingEndTimer = this.addRecordingEndTimer;
    this.stRecording.endRecording = this.endRecording;
    this.stRecording.recordingObsolete = this.recordingObsolete;
    this.stRecording.executeStartRecording = this.executeStartRecording;
    this.stRecording.handleAddRecord = this.handleAddRecord;
    this.stRecording.addToDB = this.addToDB;

    this.topState = this.stTop;
}

//subclass extends superclass
recordingEngineStateMachine.prototype = Object.create(HSM.prototype);
recordingEngineStateMachine.prototype.constructor = recordingEngineStateMachine;

recordingEngineStateMachine.prototype.InitializeRecordingEngineHSM = function () {

    consoleLog("InitializeRecordingEngineHSM invoked");
    return this.stIdle;
}

// methods at class scope

recordingEngineStateMachine.prototype.recordingObsolete = function (startDateTime, durationInMilliseconds) {
    var dtStartOfRecording = new Date(startDateTime);
    var dtEndOfRecording = addMilliseconds(dtStartOfRecording, durationInMilliseconds);
    var now = new Date();
    var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
    return millisecondsUntilEndOfRecording < 0;
}


recordingEngineStateMachine.prototype.startRecordingNow = function (dateTime) {

    var dtStartOfRecording = new Date(dateTime);
    var now = new Date();
    var millisecondsUntilRecording = dtStartOfRecording - now;

    return millisecondsUntilRecording < 0;
}


recordingEngineStateMachine.prototype.msUntilRecordingStarts = function (dateTime) {

    var dtStartOfRecording = new Date(dateTime);
    var now = new Date();
    return dtStartOfRecording - now;
}


recordingEngineStateMachine.prototype.buildToDoList = function (nextFunction, idle) {

    var self = this;

    // build initial toDoList
    // get scheduled recordings from db
    // for each scheduled recording that is a series, query the epg db to find all programs that have the
    //      same series name and channel

    this.toDoList = [];

    // save all promises so that their completion can be tracked
    var promises = [];

    // get scheduled recordings from db

    // single recordings
    var p1 = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledSingleRecordings";

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = { "currentDateTime": currentDateTimeIso };

        $.get(
            aUrl,
            currentDateTime
        ).then(function (result) {
            $.each(result.scheduledrecordings, function (index, scheduledRecording) {
                // convert from string object (as stored by db) back into Date object
                scheduledRecording.DateTime = new Date(scheduledRecording.DateTime);
                self.toDoList.push(scheduledRecording);
            });
            resolve();
        }, function () {
            reject();
        });
    });

    p1.then(function() {
        console.log("p1 resolved");
    }, function() {
        console.log("p1 error");
    });

    promises.push(p1);

    var p2 = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledSeriesRecordings";

        $.get(
            aUrl
        ).then(function (result) {
            resolve(result.scheduledrecordings);
        });
    });

    p2.then(function(scheduledRecordings) {

        console.log("p2 resolved");

        var epgStartDate = Date.now().toISOString();

        $.each(scheduledRecordings, function (index, scheduledRecording) {

            promises.push(new Promise(function(resolve, reject) {

                // get matching programs from epg data
                var atsc = scheduledRecording.Channel.split("-");
                var getEpgMatchingProgramsData = {
                    "startDate": epgStartDate,
                    "title": scheduledRecording.Title,
                    "atscMajor": atsc[0],
                    "atscMinor": atsc[1]
                };

                var url = baseURL + "getEpgMatchingPrograms";
                $.get(
                    url,
                    getEpgMatchingProgramsData
                ).then(function(result) {
                        consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpgMatchingPrograms success ************************************");

                        // add each matching program to toDoList
                        $.each(result, function (index, sdProgram) {

                            // make a copy of scheduledRecording to get a unique object
                            scheduledEpisode = {};
                            scheduledEpisode.Channel = scheduledRecording.Channel;
                            scheduledEpisode.DateTime = new Date(sdProgram.AirDateTime);
                            scheduledEpisode.EndDateTime = new Date(sdProgram.EndDateTime);
                            scheduledEpisode.Duration = sdProgram.Duration;
                            scheduledEpisode.InputSource = scheduledRecording.InputSource;
                            scheduledEpisode.RecordingBitRate = scheduledRecording.RecordingBitRate;
                            scheduledEpisode.SegmentRecording = scheduledRecording.SegmentRecording;
                            scheduledEpisode.ShowType = scheduledRecording.ShowType;
                            scheduledEpisode.Title = scheduledRecording.Title;
                            self.toDoList.push(scheduledEpisode);

                            self.toDoList.sort(function (a, b) {
                                var aStr = a.DateTime.toISOString();
                                var bStr = b.DateTime.toISOString();
                                if (aStr > bStr) {
                                    return 1;
                                }
                                else if (aStr < bStr) {
                                    return -1;
                                }
                                else {
                                    return 0;
                                }
                            });
                        });

                        resolve();
                    }, function () {
                        reject();
                    });
            }));

            promises[index].then(function() {
                console.log("resolved");
            }, function() {
                console.log("error");
            });
        });

        Promise.all(promises).then(function() {
            console.log("all promises completed");

            if (nextFunction != null) {
                nextFunction.call(self, idle);
            }
        });

    }, function() {
        console.log("error");
    });
}


// invoked on startup, when a recording has completed, or TBD
// check first item on toDoList - determine whether or not to set a timer or actually start recording
// given that items are read from the toDoList, no need to add recordings to db (therefore, no need to call addRecording)
recordingEngineStateMachine.prototype.checkForPendingRecord = function (idle) {

    // if a recording is already active, skip this step - may be able to further optimize - that is, no reason to build new to do list
    if (!idle) {
        return;
    }

    // any scheduled recordings on toDoList?
    while (this.toDoList.length > 0) {

        // get first one
        var scheduledRecording = this.toDoList[0];

        // check to see if recording is obsolete (a recording is obsolete if there's less than 30 seconds remaining)
        // if it is, ignore it; keep going until a valid recording is found
        // JTRTODO remove it from the database if it's obsolete
        var durationInMilliseconds = minutesToMsec(Number(scheduledRecording.Duration)) - 30000;
        var recordingObsolete = this.recordingObsolete(scheduledRecording.DateTime, durationInMilliseconds);
        if (recordingObsolete) {
            this.toDoList.shift();
        }
        else {
            // see if recording should start immediately (program in progress)
            var msUntilRecordingStarts = this.msUntilRecordingStarts(scheduledRecording.DateTime);
            if (msUntilRecordingStarts <= 0) {
                // reduce duration of recording by elapsed time since program began
                var durationInMilliseconds = minutesToMsec(Number(scheduledRecording.Duration)) + msUntilRecordingStarts;

                // post internal message to cause transition to recording state
                var event = {};
                event["EventType"] = "TRANSITION_TO_RECORDING";
                this.recordingTitle = scheduledRecording.Title;
                this.recordingDuration = durationInMilliseconds;
                this.recordingInputSource = scheduledRecording.InputSource;
                this.recordingChannel = scheduledRecording.Channel;
                this.recordingBitRate = scheduledRecording.RecordingBitRate;
                this.recordingSegment = scheduledRecording.SegmentRecording;
                this.recordingShowType = scheduledRecording.ShowType;

                postMessage(event);
            }
            // if not, set timer for when first recording should begin
            else {
                // but if there's a timer already active, cancel it first
                if (this.timerVar != null) {
                    clearTimeout(this.timerVar);
                    this.timerVar = null;
                }
                this.startRecordingTimer(msUntilRecordingStarts, scheduledRecording.Title, scheduledRecording.Duration, scheduledRecording.InputSource, scheduledRecording.Channel, scheduledRecording.RecordingBitRate, scheduledRecording.SegmentRecording, scheduledRecording.ShowType);
            }
            return;
        }
    }
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
        if (!this.stateMachine.firstTime) {
            this.stateMachine.buildToDoList(this.stateMachine.checkForPendingRecord, true);
        }
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "READY") {
        consoleLog(this.id + ": READY message received");

        if (this.stateMachine.firstTime) {
            this.stateMachine.buildToDoList(this.stateMachine.checkForPendingRecord, true);
            this.stateMachine.firstTime = false;
            return "HANDLED";
        }

        return "HANDLED";
    }
    else if (event["EventType"] == "TRANSITION_TO_RECORDING") {
        consoleLog("TRANSITION_TO_RECORDING event received");
        stateData.nextState = this.stateMachine.stRecording;
        return "TRANSITION";
    }
    else if (event["EventType"] == "RECORD_NOW") {
        this.stateMachine.recordingTitle = event["Title"];
        this.stateMachine.recordingDuration = Number(event["Duration"]);
        this.stateMachine.recordingInputSource = event["InputSource"];
        this.stateMachine.recordingChannel = event["Channel"];
        this.stateMachine.recordingBitRate = event["RecordingBitRate"];
        this.stateMachine.recordingSegment = event["SegmentRecording"];
        this.stateMachine.recordingShowType = event["ShowType"];

        consoleLog("STIdleEventHandler: RECORD_NOW received. Title = " + this.stateMachine.recordingTitle + ", duration = " + this.stateMachine.recordingDuration + ", inputSource = " + this.stateMachine.recordingInputSource + ", channel = " + this.stateMachine.recordingChannel + ", recordingBitRate = " + this.stateMachine.recordingBitRate + ", segmentRecording = " + this.stateMachine.recordingSegment + ", showType = " + this.stateMachine.showType);

        stateData.nextState = this.stateMachine.stRecording;
        return "TRANSITION";
    }
    else if (event["EventType"] == "ADD_RECORD") {
        return this.handleAddRecord(event, stateData, true);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.addToDB = function (dateTime, title, durationInMinutes, inputSource, channel, recordingBitRate, segmentRecording, showType, idle) {

    var aUrl;
    var recordingData;
    var recordingEngineIdle = idle;

    if (showType == "Series") {
        aUrl = baseURL + "addScheduledSeriesRecording";
        recordingData = { "title": title, "inputSource": inputSource, "channel": channel, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording, "showType": showType, "maxRecordings": 5, "recordReruns": 1 };
    }
    else {
        var dtStartOfRecording = new Date(dateTime);
        var isoDateTime = dtStartOfRecording.toISOString();

        aUrl = baseURL + "addScheduledSingleRecording";
        recordingData = { "dateTime": isoDateTime, "title": title, "duration": durationInMinutes, "inputSource": inputSource, "channel": channel, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording, "showType": showType };
    }

    var self = this;

    $.get(aUrl, recordingData)
        .done(function (result) {
            consoleLog("addScheduledRecording successfully sent");
            var scheduledRecordingId = Number(result);
            consoleLog("scheduledRecordingId=" + scheduledRecordingId);

            // add complete, move on to next step
            if (idle) {
                // add the recording to the toDoList - if system is idle, invoke checkForPendingRecord next
                var nextFunction = null;
                if (idle) {
                    nextFunction = self.stateMachine.checkForPendingRecord;
                }
                self.stateMachine.buildToDoList(nextFunction, idle);
            }
        })

        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("addScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


recordingEngineStateMachine.prototype.handleAddRecord = function (event, stateData, idle) {

    // get recording parameters
    var dateTime = event["DateTime"];
    var title = event["Title"];
    var durationInMinutes = event["Duration"];
    var inputSource = event["InputSource"];
    var channel = event["Channel"];
    var recordingBitRate = event["RecordingBitRate"];
    var segmentRecording = event["SegmentRecording"];
    var showType = event["ShowType"];

    // ignore manual recordings that are in the past
    var durationInMilliseconds = minutesToMsec(Number(durationInMinutes));
    console.log("handleAddRecord: durationInMinutes=" + durationInMinutes.toString());
    var recordingObsolete = this.recordingObsolete(dateTime, durationInMilliseconds);
    if (recordingObsolete) {
        consoleLog("Recording in the past, ignore request.");
        return "HANDLED";
    }

    // add the recording to the db
    this.addToDB(dateTime, title, durationInMinutes, inputSource, channel, recordingBitRate, segmentRecording, showType, idle);

    // JTRTODO - better done here if promises meet their promise
    // add the recording to the toDoList - if system is idle, invoke checkForPendingRecord next
    //var nextFunction = null;
    //if (idle) {
    //    nextFunction = this.stateMachine.checkForPendingRecord();
    //}
    //this.stateMachine.buildToDoList(nextFunction);
}


recordingEngineStateMachine.prototype.STRecordingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    console.log("STRecordingEventHandler: event=" + event["EventType"]);

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.startRecording(this.stateMachine.recordingTitle, this.stateMachine.recordingDuration, this.stateMachine.recordingInputSource, this.stateMachine.recordingChannel, this.stateMachine.recordingBitRate, this.stateMachine.recordingSegment);
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
    else if (event["EventType"] == "ADD_RECORD") {
        return this.handleAddRecord(event, stateData, false);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


// TODO - save this in case user wants to cancel a recording?

// duration passed in as minutes here where msec are expected?
recordingEngineStateMachine.prototype.startRecordingTimer = function (millisecondsUntilRecording, title, duration, inputSource, channel, recordingBitRate, segmentRecording, showType) {
    consoleLog("startRecordingTimer - start timer: millisecondsUntilRecording=" + millisecondsUntilRecording);
    var self = this;
    // when timeout occurs, setup variables and send message indicating a transition to recording state

    console.log("startTimer at: ");
    printNow();

    var durationInMilliseconds = minutesToMsec(duration);

    this.timerVar = setTimeout(function () {

        this.timerVar = null;

        consoleLog("startRecordingTimer: timeout");

        console.log("startRecordingTimer timeout at: ");
        printNow();

        self.recordingTitle = title;
        self.recordingDuration = durationInMilliseconds;
        self.recordingInputSource = inputSource;
        self.recordingChannel = channel;
        self.recordingBitRate = recordingBitRate;
        self.recordingSegment = segmentRecording;
        self.recordingShowType = showType;

        var event = {};
        event["EventType"] = "TRANSITION_TO_RECORDING";
        postMessage(event);
    }, millisecondsUntilRecording);
}


recordingEngineStateMachine.prototype.startRecording = function (title, durationInMilliseconds, inputSource, channel, recordingBitRate, segmentRecording, showType) {

    consoleLog("startRecording: title=" + title + ", durationInMilliseconds=" + durationInMilliseconds + ", inputSource=" + inputSource + ",channel=" + channel + ",recordingBitRate=" + recordingBitRate + ",segmentRecording=" + segmentRecording + ",showType=" + showType);

    setUserHDMIInput(inputSource);

    if (inputSource != "tuner") {
        consoleLog("Not tuner: Title = " + title + ", durationInMilliseconds = " + durationInMilliseconds + ", inputSource = " + inputSource + ", channel = " + channel);
        this.executeStartRecording(title, durationInMilliseconds, recordingBitRate, segmentRecording, showType);
    }
    else {
        // try to relieve issues with IR out interference by waiting two seconds.
        var self = this;
        setTimeout(function () {
            tuneChannel(channel, false);
            self.executeStartRecording(title, durationInMilliseconds, recordingBitRate, segmentRecording, showType);
        }, 2000);
    }
}

recordingEngineStateMachine.prototype.executeStartRecording = function (title, durationInMilliseconds, recordingBitRate, segmentRecording, showType) {

    // subtract 4 seconds from duration
    durationInMilliseconds -= 4000;

    bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": durationInMilliseconds, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording, "showType": showType });
    this.addRecordingEndTimer(durationInMilliseconds, title, new Date(), durationInMilliseconds);
    displayUserMessage("Recording started: " + title);
}


// TODO - save this in case user wants to stop a recording?
var endOfRecordingTimer;
recordingEngineStateMachine.prototype.addRecordingEndTimer = function (durationInMilliseconds, title, dateTime, duration) {
    consoleLog("addRecordingEndTimer - start timer: durationInMilliseconds=" + durationInMilliseconds);
    var self = this;
    endOfRecordingTimer = setTimeout(function () {
        consoleLog("addRecordingEndTimer - endOfRecordingTimer triggered");
        console.log("endOfRecordingTimer triggered at: ");
        printNow();

        self.endRecording(title, dateTime, duration);
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


recordingEngineStateMachine.prototype.deleteScheduledRecording = function (scheduledRecordingId, showType) {

    var aUrl;
    
    if (showType == "Series") {
        aUrl = baseURL + "deleteScheduledSeriesRecording";
    }
    else {
        aUrl = baseURL + "deleteScheduledSingleRecording";
    }

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


function printNow() {
    var currentdate = new Date();
    var datetime =    currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds() + ":"
                    + currentdate.getMilliseconds();
    console.log("current dateTime is " + datetime);
}