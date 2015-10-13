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
    this.stIdle.handleUpdateRecord = this.handleUpdateRecord;
    this.stIdle.handleAddSeries = this.handleAddSeries;
    this.stIdle.addProgramToDB = this.addProgramToDB;
    this.stIdle.addSeriesToDB = this.addSeriesToDB;

    this.stRecording = new HState(this, "Recording");
    this.stRecording.HStateEventHandler = this.STRecordingEventHandler;
    this.stRecording.superState = this.stRecordingController;
    this.stRecording.startRecording = this.startRecording;
    this.stRecording.addRecordingEndTimer = this.addRecordingEndTimer;
    this.stRecording.endRecording = this.endRecording;
    this.stRecording.recordingObsolete = this.recordingObsolete;
    this.stRecording.executeStartRecording = this.executeStartRecording;
    this.stRecording.handleAddRecord = this.handleAddRecord;
    this.stRecording.handleUpdateRecord = this.handleUpdateRecord;
    this.stRecording.handleAddSeries = this.handleAddSeries;
    this.stRecording.addProgramToDB = this.addProgramToDB;
    this.stRecording.addSeriesToDB = this.addSeriesToDB;
    this.stRecording.deleteScheduledRecording = this.deleteScheduledRecording;

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


recordingEngineStateMachine.prototype.buildToDoList = function () {

    var self = this;

    // build toDoList - in memory representation of scheduledRecordings table from db

    this.toDoList = [];

    // get scheduled recordings from db
    var getScheduledRecordingsPromise = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledRecordings";

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = { "currentDateTime": currentDateTimeIso };

        $.get(
            aUrl,
            currentDateTime
        ).then(function (scheduledRecordings) {
                $.each(scheduledRecordings, function (index, scheduledRecording) {
                    // convert from string object (as stored by db) back into Date object
                    scheduledRecording.DateTime = new Date(scheduledRecording.DateTime);
                    self.toDoList.push(scheduledRecording);
                });
                resolve();
            }, function () {
                reject();
            });
    });

    getScheduledRecordingsPromise.then(function() {

        console.log("buildToDoList: scheduledRecordings retrieved from db");

        // sort scheduled recordings by date
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

        self.checkForPendingRecord();

    }, function() {
        console.log("getScheduledRecordingsPromise error");
    });
}


// invoked on startup, when a recording has completed, or TBD
// check first item on toDoList - determine whether or not to set a timer or actually start recording
// given that items are read from the toDoList, no need to add recordings to db (therefore, no need to call addRecording)
recordingEngineStateMachine.prototype.checkForPendingRecord = function () {

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
            // adjust start time, duration by startTimeOffset, stopTimeOffset
            var actualStartDateTime = scheduledRecording.DateTime;
            actualStartDateTime.setMinutes(scheduledRecording.DateTime.getMinutes() + scheduledRecording.StartTimeOffset);

            var actualDuration = Number(scheduledRecording.Duration);
            actualDuration = actualDuration - scheduledRecording.StartTimeOffset + scheduledRecording.StopTimeOffset;

            var durationInMilliseconds = minutesToMsec(actualDuration);

            // see if recording should start immediately (program in progress)
            var msUntilRecordingStarts = this.msUntilRecordingStarts(actualStartDateTime);
            if (msUntilRecordingStarts <= 0) {
                // reduce duration of recording by elapsed time since program began
                durationInMilliseconds += msUntilRecordingStarts;

                // post internal message to cause transition to recording state
                var event = {};
                event["EventType"] = "TRANSITION_TO_RECORDING";
                this.recordingId = scheduledRecording.Id;
                this.recordingTitle = scheduledRecording.Title;
                this.recordingDuration = durationInMilliseconds;
                this.recordingInputSource = scheduledRecording.InputSource;
                this.recordingChannel = scheduledRecording.Channel;
                this.recordingBitRate = scheduledRecording.RecordingBitRate;
                this.recordingSegment = scheduledRecording.SegmentRecording;

                postMessage(event);
            }
            // if not, set timer for when first recording should begin
            else {
                // but if there's a timer already active, cancel it first
                if (this.timerVar != null) {
                    clearTimeout(this.timerVar);
                    this.timerVar = null;
                }
                this.startRecordingTimer(msUntilRecordingStarts, scheduledRecording.Id, scheduledRecording.Title, durationInMilliseconds, scheduledRecording.InputSource, scheduledRecording.Channel, scheduledRecording.RecordingBitRate, scheduledRecording.SegmentRecording);
            }
            return;
        }
    }
}


recordingEngineStateMachine.prototype.STRecordingControllerEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.stateMachine.endOfRecordingTimer = null;
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "EPG_DB_UPDATES_COMPLETE") {
        console.log("EPG_DB_UPDATES_COMPLETE received.")
        updateScheduledRecordings();
    }
    else if (event["EventType"] == "STOP_RECORDING") {
        //JTRTODO - recordingId used here?
        var recordingId = event["EventData"];
        console.log("STOP_RECORDING invoked for recordingId = " + recordingId);
        this.stateMachine.stopRecording();
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.STIdleEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        if (!this.stateMachine.firstTime) {
            this.stateMachine.buildToDoList();
        }
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "READY") {
        consoleLog(this.id + ": READY message received");

        if (this.stateMachine.firstTime) {
            this.stateMachine.buildToDoList();
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
        this.stateMachine.recordingId = -1;         // not in db
        this.stateMachine.recordingTitle = event["Title"];
        this.stateMachine.recordingDuration = minutesToMsec(Number(event["Duration"]));
        this.stateMachine.recordingInputSource = event["InputSource"];
        this.stateMachine.recordingChannel = event["Channel"];
        this.stateMachine.recordingBitRate = event["RecordingBitRate"];
        this.stateMachine.recordingSegment = event["SegmentRecording"];

        consoleLog("STIdleEventHandler: RECORD_NOW received. Title = " + this.stateMachine.recordingTitle + ", duration = " + this.stateMachine.recordingDuration + ", inputSource = " + this.stateMachine.recordingInputSource + ", channel = " + this.stateMachine.recordingChannel + ", recordingBitRate = " + this.stateMachine.recordingBitRate + ", segmentRecording = " + this.stateMachine.recordingSegment);

        stateData.nextState = this.stateMachine.stRecording;
        return "TRANSITION";
    }
    else if (event["EventType"] == "ADD_RECORD") {
        return this.handleAddRecord(event, stateData, true);
    }
    else if (event["EventType"] == "UPDATE_SCHEDULED_RECORDING") {
        return this.handleUpdateRecord(event, stateData, true);
    }
    else if (event["EventType"] == "ADD_SERIES") {
        return this.handleAddSeries(event, stateData, true);
    }
    else if (event["EventType"] == "SCHEDULED_RECORDINGS_UPDATED") {
        console.log("SCHEDULED_RECORDINGS_UPDATED received.");
        this.stateMachine.buildToDoList();
        this.stateMachine.firstTime = false;
        return "HANDLED";
    }
    else if (event["EventType"] == "DELETE_SCHEDULED_RECORDING") {
        console.log("DELETE_SCHEDULED_RECORDING received.");
        this.stateMachine.buildToDoList();
        this.stateMachine.firstTime = false;
        return "HANDLED";
    }


    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.addProgramToDB = function (dateTime, title, durationInMinutes, inputSource, channel, recordingBitRate, segmentRecording, scheduledSeriesRecordingId, startTimeOffset, stopTimeOffset, idle) {

    var aUrl;
    var recordingData;
    var recordingEngineIdle = idle;

    aUrl = baseURL + "addScheduledRecording";

    var dtStartOfRecording = new Date(dateTime);
    var isoDateTime = dtStartOfRecording.toISOString();

    var endDateTime = new Date(dtStartOfRecording);
    endDateTime.setSeconds(endDateTime.getSeconds() + durationInMinutes * 60);
    var isoEndDate = endDateTime.toISOString();

    recordingData = { "dateTime": isoDateTime, "endDateTime": isoEndDate, "title": title, "duration": durationInMinutes, "inputSource": inputSource, "channel": channel, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording, "scheduledSeriesRecordingId": scheduledSeriesRecordingId,
        "startTimeOffset": startTimeOffset, "stopTimeOffset": stopTimeOffset };

    var self = this;

    $.get(aUrl, recordingData)
        .done(function (result) {
            consoleLog("addScheduledRecording successfully sent");
            var scheduledRecordingId = Number(result);
            this.recordingId = scheduledRecordingId;
            consoleLog("scheduledRecordingId=" + scheduledRecordingId);

            if (idle) {
                self.stateMachine.buildToDoList();
            }
        })

        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("addScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        }
        );
}


recordingEngineStateMachine.prototype.addSeriesToDB = function (title, inputSource, channel, recordingBitRate, segmentRecording, idle) {

    var recordingData;
    var recordingEngineIdle = idle;

    var aUrl = baseURL + "addScheduledSeriesRecording";
    recordingData = { "title": title, "inputSource": inputSource, "channel": channel, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording, "maxRecordings": 5, "recordReruns": 1 };

    var self = this;

    $.get(aUrl, recordingData)
        .done(function (result) {
            consoleLog("addScheduledSeriesRecording successfully sent");
            var scheduledSeriesRecordingId = Number(result);
            consoleLog("scheduledSeriesRecordingId=" + scheduledSeriesRecordingId);

            // series recording has been added - add episodes in epg data to scheduledRecordings
            var epgStartDate = Date.now().toISOString();
            var atsc = channel.split("-");
            var getEpgMatchingProgramsData = {
                "startDate": epgStartDate,
                "title": title,
                "atscMajor": atsc[0],
                "atscMinor": atsc[1]
            };

            var url = baseURL + "getEpgMatchingPrograms";
            $.get(url, getEpgMatchingProgramsData)
                .done(function (result) {

                    // save all promises so that their completion can be tracked
                    var promises = [];

                    consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpgMatchingPrograms success ************************************");

                    // add each matching program to scheduledRecordings
                    $.each(result, function (index, seriesEpisode) {

                        promises.push(new Promise(function(resolve, reject) {

                            // add scheduledEpisode to scheduledRecordings
                            aUrl = baseURL + "addScheduledRecording";

                            // JTRTODO - check units of Duration (expect it to be minutes here)
                            var endDateTime = new Date(seriesEpisode.AirDateTime);
                            endDateTime.setSeconds(endDateTime.getSeconds() + seriesEpisode.Duration * 60);
                            var isoEndDate = endDateTime.toISOString();

                            recordingData = {
                                "dateTime": seriesEpisode.AirDateTime,
                                "endDateTime": isoEndDate,
                                "title": title,
                                "duration": seriesEpisode.Duration,
                                "inputSource": inputSource,
                                "channel": channel,
                                "recordingBitRate": recordingBitRate,
                                "segmentRecording": segmentRecording,
                                "scheduledSeriesRecordingId": scheduledSeriesRecordingId,
                                "startTimeOffset": 0,
                                "stopTimeOffset": 0
                            };
                            $.get(aUrl, recordingData)
                                .then(function (result) {
                                    resolve();
                                    console.log("series episode added successfully")
                                }, function() {
                                    reject();
                                });
                        }))
                    });

                    Promise.all(promises).then(function() {
                        if (idle) {
                            self.stateMachine.buildToDoList();
                        }
                    });
            });
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("addScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        })
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
    var scheduledSeriesRecordingId = event["ScheduledSeriesRecordingId"];
    var startTimeOffset = event["StartTimeOffset"];
    var stopTimeOffset = event["StopTimeOffset"];

    // ignore manual recordings that are in the past
    // EXTENDOMATIC - need to take into account startTimeOffset, stopTimeOffset
    var durationInMilliseconds = minutesToMsec(Number(durationInMinutes));
    console.log("handleAddRecord: durationInMinutes=" + durationInMinutes.toString());
    var recordingObsolete = this.recordingObsolete(dateTime, durationInMilliseconds);
    if (recordingObsolete) {
        consoleLog("Recording in the past, ignore request.");
        return "HANDLED";
    }

    // add the recording to the db
    this.addProgramToDB(dateTime, title, durationInMinutes, inputSource, channel, recordingBitRate, segmentRecording, scheduledSeriesRecordingId,
        startTimeOffset, stopTimeOffset, idle);
}


recordingEngineStateMachine.prototype.handleUpdateRecord = function (event, stateData, idle) {

    var id = event["Id"];
    var startTimeOffset = event["StartTimeOffset"];
    var stopTimeOffset = event["StopTimeOffset"];

    // JTRTODO - changing the recording could mean that the recording should start now. not supported yet.

    var aUrl = baseURL + "updateScheduledRecording";

    var scheduledRecording = { "id": id, "startTimeOffset": startTimeOffset, "stopTimeOffset": stopTimeOffset };

    var self = this;

    $.get(aUrl, scheduledRecording)
        .done(function (result) {
            consoleLog("updateScheduledRecording successfully sent");

            if (idle) {
                self.stateMachine.buildToDoList();
            }
        })

        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("updateScheduledRecording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        }
    );
}

recordingEngineStateMachine.prototype.handleAddSeries = function (event, stateData, idle) {

    // get recording parameters
    var title = event["Title"];
    var inputSource = event["InputSource"];
    var channel = event["Channel"];
    var recordingBitRate = event["RecordingBitRate"];
    var segmentRecording = event["SegmentRecording"];

    // add the series to the db
    this.addSeriesToDB(title, inputSource, channel, recordingBitRate, segmentRecording, idle);
}


recordingEngineStateMachine.prototype.STRecordingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    console.log("STRecordingEventHandler: event=" + event["EventType"]);

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.startRecording(this.stateMachine.recordingId, this.stateMachine.recordingTitle, this.stateMachine.recordingDuration, this.stateMachine.recordingInputSource, this.stateMachine.recordingChannel, this.stateMachine.recordingBitRate, this.stateMachine.recordingSegment);
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
    else if (event["EventType"] == "UPDATE_SCHEDULED_RECORDING") {
        return this.handleUpdateRecord(event, stateData, false);
    }
    else if (event["EventType"] == "ADD_SERIES") {
        return this.handleAddSeries(event, stateData, false);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


recordingEngineStateMachine.prototype.startRecordingTimer = function (millisecondsUntilRecording, recordingId, title, durationInMilliseconds, inputSource, channel, recordingBitRate, segmentRecording) {// duration passed in as minutes here where msec are expected?
    consoleLog("startRecordingTimer - start timer: millisecondsUntilRecording=" + millisecondsUntilRecording);
    var self = this;
    // when timeout occurs, setup variables and send message indicating a transition to recording state

    console.log("startTimer at: ");
    printNow();

    this.timerVar = setTimeout(function () {

        this.timerVar = null;

        consoleLog("startRecordingTimer: timeout");

        console.log("startRecordingTimer timeout at: ");
        printNow();

        self.recordingId = recordingId;
        self.recordingTitle = title;
        self.recordingDuration = durationInMilliseconds;
        self.recordingInputSource = inputSource;
        self.recordingChannel = channel;
        self.recordingBitRate = recordingBitRate;
        self.recordingSegment = segmentRecording;

        var event = {};
        event["EventType"] = "TRANSITION_TO_RECORDING";
        postMessage(event);
    }, millisecondsUntilRecording);
}


recordingEngineStateMachine.prototype.startRecording = function (recordingId, title, durationInMilliseconds, inputSource, channel, recordingBitRate, segmentRecording) {

    consoleLog("startRecording: title=" + title + ", durationInMilliseconds=" + durationInMilliseconds + ", inputSource=" + inputSource + ",channel=" + channel + ",recordingBitRate=" + recordingBitRate + ",segmentRecording=" + segmentRecording);

    setUserHDMIInput(inputSource);

    if (inputSource != "tuner") {
        consoleLog("Not tuner: Title = " + title + ", durationInMilliseconds = " + durationInMilliseconds + ", inputSource = " + inputSource + ", channel = " + channel);
        this.executeStartRecording(recordingId, title, durationInMilliseconds, recordingBitRate, segmentRecording);
    }
    else {
        // try to relieve issues with IR out interference by waiting two seconds.
        var self = this;
        setTimeout(function () {
            tuneChannel(channel, false);
            self.executeStartRecording(recordingId, title, durationInMilliseconds, recordingBitRate, segmentRecording);
        }, 2000);
    }
}

recordingEngineStateMachine.prototype.executeStartRecording = function (recordingId, title, durationInMilliseconds, recordingBitRate, segmentRecording) {

    // subtract 4 seconds from duration
    durationInMilliseconds -= 4000;

    bsMessage.PostBSMessage({ command: "recordNow", "title": title, "duration": durationInMilliseconds, "recordingBitRate": recordingBitRate, "segmentRecording": segmentRecording });
    this.stateMachine.recordingStartTime = new Date();
    consoleLog("------------------------------ executeStartRecording: recordingId=" + recordingId.toString());

    // extendomatic todo
    // durationInMilliseconds should be actual duration here (adjusted by startTimeOffset, stopTimeOffset)
    // however, recordingStartTime is not the actual startTime
    // no, I think it is - notice how this.stateMachine.recordingStartTime is set a few lines above and is 'now'
    this.addRecordingEndTimer(recordingId, durationInMilliseconds, title, this.stateMachine.recordingStartTime);
    displayUserMessage("Recording started: " + title);
}


// TODO - save this in case user wants to stop a recording?
recordingEngineStateMachine.prototype.addRecordingEndTimer = function (recordingId, durationInMilliseconds, title, dateTime) {
    consoleLog("addRecordingEndTimer - start timer: durationInMilliseconds=" + durationInMilliseconds);
    var self = this;
    this.stateMachine.endOfRecordingTimer = setTimeout(function () {

        self.stateMachine.endOfRecordingTimer = null;

        consoleLog("addRecordingEndTimer - endOfRecordingTimer triggered at:");
        printNow();

        self.endRecording(title, dateTime, durationInMilliseconds);
        self.deleteScheduledRecording(recordingId, "");

    }, durationInMilliseconds);
}


recordingEngineStateMachine.prototype.stopRecording = function () {

    if (this.endOfRecordingTimer != null) {
        clearTimeout(this.endOfRecordingTimer);
        this.endOfRecordingTimer = null;
    }

    consoleLog("stopRecording at: ");
    printNow();

    var currentTime = new Date();
    // extendomatic todo - recordingStartTime may not be the actual start time; therefore, durationInMilliseconds might not be the actual duration
    // what is this.recordingStartTime - where was it set?
    // executeStartRecording?? - perhaps it is okay?

    var durationInMilliseconds = currentTime - this.recordingStartTime;
    this.endRecording(this.recordingTitle, this.recordingStartTime, durationInMilliseconds);
    this.deleteScheduledRecording(this.recordingId, "Single");
}

recordingEngineStateMachine.prototype.endRecording = function (title, dateTime, duration) {
    consoleLog("endRecording: title = " + title + ", dateTime = " + dateTime + ", duration = " + duration);

    bsMessage.PostBSMessage({ command: "endRecording", duration: duration, startSegmentation: true });

    var event = {};
    event["EventType"] = "TRANSITION_TO_IDLE";
    postMessage(event);
}


// is this or will it ever be used?
recordingEngineStateMachine.prototype.deleteScheduledRecording = function (scheduledRecordingId) {

    var aUrl = baseURL + "deleteScheduledRecording";
    var recordingId = { "scheduledRecordingId": scheduledRecordingId };

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


