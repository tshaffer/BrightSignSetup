function displayEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.playIconDisplayTime = 1500;
    this.miscIconDisplayTime = 1000;
    this.ffCount = 1;
    this.maxFFCount = 4;        // JTR TODO - here or in .brs?
    this.rwCount = 1;
    this.maxRWCount = 4;

    this.InitialPseudoStateHandler = this.InitializeDisplayEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stIdle = new HState(this, "Idle");
    this.stIdle.HStateEventHandler = this.STIdleEventHandler;
    this.stIdle.superState = this.stTop;
    this.stIdle.playSelectedShow = this.playSelectedShow;
    this.stIdle.toggleClock = this.toggleClock;
    this.stIdle.formatCurrentTime = this.formatCurrentTime;

    this.stShowingVideo = new HState(this, "ShowingVideo");
    this.stShowingVideo.HStateEventHandler = this.STShowingVideoEventHandler;
    this.stShowingVideo.superState = this.stTop;
    this.stShowingVideo.calculateProgressBarParameters = this.calculateProgressBarParameters;
    this.stShowingVideo.toggleProgressBar = this.toggleProgressBar;
    this.stShowingVideo.updateProgressBarGraphics = this.updateProgressBarGraphics;
    this.stShowingVideo.toggleClock = this.toggleClock;
    this.stShowingVideo.formatCurrentTime = this.formatCurrentTime;

    this.stLiveVideo = new HState(this, "LiveVideo");
    this.stLiveVideo.HStateEventHandler = this.STLiveVideoEventHandler;
    this.stLiveVideo.superState = this.stShowingVideo;
    this.stLiveVideo.playSelectedShow = this.playSelectedShow;
    this.stLiveVideo.startChannelEntryTimer = this.startChannelEntryTimer;
    this.stLiveVideo.tuneLiveVideoChannel = this.tuneLiveVideoChannel;
    this.stLiveVideo.getChannelIdFromChannel = this.getChannelIdFromChannel;
    this.stLiveVideo.displayChannel = this.displayChannel;
    this.stLiveVideo.hideChannel = this.hideChannel;
    this.stLiveVideo.fadedOut = this.fadedOut;
    this.stLiveVideo.startChannelDisplayTimer = this.startChannelDisplayTimer;
    //TODO
    this.stLiveVideo.tunerChannels = ["2", "4", "5", "7", "9-1", "9-2", "9-3", "11", "36", "44"];

    this.stPlaying = new HState(this, "Playing");
    this.stPlaying.HStateEventHandler = this.STPlayingEventHandler;
    this.stPlaying.superState = this.stShowingVideo;
    this.stPlaying.playSelectedShow = this.playSelectedShow;
    this.stPlaying.jump = this.jump;

    this.stPaused = new HState(this, "Paused");
    this.stPaused.HStateEventHandler = this.STPausedEventHandler;
    this.stPaused.superState = this.stShowingVideo;
    this.stPaused.playSelectedShow = this.playSelectedShow;

    this.stFastForwarding = new HState(this, "FastForwarding");
    this.stFastForwarding.HStateEventHandler = this.STFastForwardingEventHandler;
    this.stFastForwarding.superState = this.stShowingVideo;
    this.stFastForwarding.playSelectedShow = this.playSelectedShow;

    this.stRewinding = new HState(this, "Rewinding");
    this.stRewinding.HStateEventHandler = this.STRewindingEventHandler;
    this.stRewinding.superState = this.stShowingVideo;
    this.stRewinding.playSelectedShow = this.playSelectedShow;

    this.topState = this.stTop;
}

//subclass extends superclass
displayEngineStateMachine.prototype = Object.create(HSM.prototype);
displayEngineStateMachine.prototype.constructor = displayEngineStateMachine;


displayEngineStateMachine.prototype.InitializeDisplayEngineHSM = function () {

    consoleLog("InitializeDisplayEngineHSM invoked");

    this.currentRecording = null;
    this.priorSelectedRecording = null;

    return this.stIdle;
}


displayEngineStateMachine.prototype.STIdleEventHandler = function (event, stateData) {

    stateData.nextState = null;
    this.clockTimer = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
    else if (event["EventType"] == "TUNE_LIVE_VIDEO") {
        stateData.nextState = this.stateMachine.stLiveVideo;
        return "TRANSITION";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "clock":
                this.toggleClock(this.stateMachine.recordingDuration);
                break;
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.formatCurrentTime = function () {

    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes().toString();
    if (minutes.length == 1)
        minutes = "0" + minutes;

    var amPM = "am";
    if (hours > 12) {
        hours -= 12;
        amPM = "pm";
    }
    return hours.toString() + ":" + minutes + " " + amPM;
}

displayEngineStateMachine.prototype.toggleClock = function () {

    console.log("toggle clock");

    if (!$("#clockP").length) {

        console.log("show clock");

        var label = this.formatCurrentTime();

        var htmlContents = '<div id="clock"><p id="clockP">' + label + '</p></div>';
        $("#videoControlRegion").append(htmlContents);

        console.log("set clock contents to " + htmlContents);

        var thisObj = this;
        this.clockTimer = setInterval(function () {
            var label = thisObj.formatCurrentTime();
            console.log("set clockP to:" + label);
            $("#clockP").text(label);
        }, 10000);

    } else {
        $("#clock").remove();
        if (this.clockTimer != null) {
            clearTimeout(this.clockTimer);
        }
        this.clockTimer = null;
    }
}



displayEngineStateMachine.prototype.playSelectedShow = function (recordingId) {

    consoleLog("playSelectedShow " + recordingId);

    // if there's a current recording, save it for later possible jump
    this.stateMachine.priorSelectedRecording = this.stateMachine.currentRecording;

    // set new recording
    this.stateMachine.currentRecording = _currentRecordings[recordingId];

    // save lastSelectedShowId in db
    var parts = [];
    parts.push("lastSelectedShowId" + '=' + recordingId.toString());
    var paramString = parts.join('&');
    var url = baseURL + "lastSelectedShow";
    $.post(url, paramString);

    eraseUI();

    // initialize value used by progress bar to last position viewed
    this.stateMachine.currentOffset = this.stateMachine.currentRecording.LastViewedPosition;

    bsMessage.PostBSMessage({ command: "playRecordedShow", "recordingId": recordingId });
}


displayEngineStateMachine.prototype.calculateProgressBarParameters = function () {

    // number of ticks to display is based on the duration of the recording
    // 0 < duration <= 5 minutes
    // every 1 minute
    // 5 minutes < duration <= 40 minutes
    // every 5 minutes
    // 40 minutes < duration <= 1 hour
    // every 10 minutes
    // 1 hour < duration <= 3 hours
    // every 15 minutes
    // 3 hours < duration <= 4 hours
    // every 30 minutes
    // 4 hours < duration
    // every hour
    this.stateMachine.recordingDuration = this.stateMachine.currentRecording.Duration * 60
    this.stateMachine.numMinutes = Math.floor(this.stateMachine.recordingDuration / 60);

    consoleLog("toggleProgressBar: duration = " + this.stateMachine.currentRecording.Duration);
    consoleLog("toggleProgressBar: numMinutes = " + this.stateMachine.numMinutes);

    this.stateMachine.numTicks = 8;
    minutesPerTick = 1;
    if (this.stateMachine.numMinutes > 240) {
        this.stateMachine.minutesPerTick = 60;
    }
    else if (this.stateMachine.numMinutes > 180) {
        this.stateMachine.minutesPerTick = 30;
    }
    else if (this.stateMachine.numMinutes > 60) {
        this.stateMachine.minutesPerTick = 15;
    }
    else if (this.stateMachine.numMinutes > 40) {
        this.stateMachine.minutesPerTick = 10;
    }
    else if (this.stateMachine.numMinutes > 5) {
        this.stateMachine.minutesPerTick = 5;
    }
    else {
        this.stateMachine.minutesPerTick = 1;
    }
    this.stateMachine.numTicks = Math.floor(this.stateMachine.numMinutes / this.stateMachine.minutesPerTick);

    consoleLog("toggleProgressBar: numTicks = " + this.stateMachine.numTicks);
    consoleLog("toggleProgressBar: minutesPerTick = " + this.stateMachine.minutesPerTick);

    // determine whether or not to draw last tick - don't draw it if it is at the end of the progress bar
    if (Math.floor(this.stateMachine.numMinutes) % (Math.floor(this.stateMachine.minutesPerTick) * this.stateMachine.numTicks) == 0) {
        this.stateMachine.numTicks--;
    }
    consoleLog("toggleProgressBar: numTicks = " + this.stateMachine.numTicks);
}


displayEngineStateMachine.prototype.toggleProgressBar = function () {

    if (!$("#progressBar").length) {
        var percentComplete = 50;
        var toAppend = '<div id="progressBar" class="meter"><span id="progressBarSpan" class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';

        var timeLabel = SecondsToHourMinuteLabel(this.stateMachine.recordingDuration)
        toAppend += '<div id="progressBarTotalTime" class="meterTotalTime"><p>' + timeLabel + '</p></div>';

        for (i = 1; i <= this.stateMachine.numTicks; i++) {
            var theId = "progressBarTick" + i.toString()
            toAppend += '<div id=' + theId + ' class="meterTick"><p></p></div>';
        }

        toAppend += '<div id="progressBarElapsedTime" class="meterCurrentPositionLabel"><p>1:00</p></div>';
        toAppend += '<div id="progressBarTickCurrent" class="meterCurrentPositionTick"><p></p></div>';

        $("#videoControlRegion").append(toAppend);

        // TODO - should retrieve these attributes dynamically - good luck with that!!
        var leftOffset = 5.5;
        var rightOffset = 89.6;
        for (i = 1; i <= this.stateMachine.numTicks; i++) {

            var durationAtTick = i * this.stateMachine.minutesPerTick;
            var totalDuration = this.stateMachine.numMinutes;

            var tickOffset = leftOffset + (rightOffset - leftOffset) * (durationAtTick / totalDuration);
            tickOffset = tickOffset - 0.25 / 2; // move to left a little to account for width of tick

            consoleLog("tickOffset=" + tickOffset.toString());
            $("#progressBarTick" + i.toString()).css({ left: tickOffset.toString() + '%', position: 'absolute' });
        }

        this.updateProgressBarGraphics();

    } else {
        $("#progressBar").remove();
        $("#progressBarTotalTime").remove();
        $("#progressBarElapsedTime").remove();
        $("#progressBarTickCurrent").remove();

        for (i = 1; i < 8; i++) {
            var theId = "#progressBarTick" + i.toString()
            $(theId).remove();
        }
    }
}


displayEngineStateMachine.prototype.updateProgressBarGraphics = function () {

    consoleLog("updateProgressBarGraphics");

    // currentOffset in seconds
    consoleLog('### currentOffset : ' + this.stateMachine.currentOffset);

    // duration in seconds
    consoleLog('### recordingDuration : ' + this.stateMachine.recordingDuration);

    var percentCompleteVal = (this.stateMachine.currentOffset / this.stateMachine.recordingDuration * 100);
    var percentComplete = percentCompleteVal.toString() + "%";
    consoleLog("percentComplete = " + percentComplete);

    $("#progressBarSpan").width(percentComplete);

    // TODO - should retrieve these attributes dynamically
    var leftOffset = 5.5;
    var rightOffset = 89.6;
    var offset = leftOffset + (rightOffset - leftOffset) * (this.stateMachine.currentOffset / this.stateMachine.recordingDuration);
    consoleLog("offset = " + offset);

    // update progress bar position (width is 4%)
    var labelOffset = offset - 4.0 / 2;
    $("#progressBarElapsedTime").css({ left: labelOffset.toString() + '%' });

    // update progress bar position tick (width is 0.25%)
    var tickOffset = offset - 0.25 / 2;
    $("#progressBarTickCurrent").css({ left: tickOffset.toString() + '%' });

    // to show where the tick is when all the way on the left (time=0)
    // var eOffset = leftOffset.toString() + "%";
    // $("#progressBarTickCurrent").css({ left: eOffset });

    // to show where the tick is when all the way on the right
    //var eOffset = rightOffset.toString() + "%";
    //$("#progressBarTickCurrent").css({ left: eOffset });

    var elapsedTimeLabel = SecondsToHourMinuteLabel(this.stateMachine.currentOffset);
    $("#progressBarElapsedTime").html("<p>" + elapsedTimeLabel + "</p>");
    //consoleLog("currentOffset is " + currentOffset + ", elapsedTimeLabel is " + elapsedTimeLabel);

    // TODO - should only need to do this when progress bar is first updated with a recording
    var totalTimeLabel = SecondsToHourMinuteLabel(this.stateMachine.recordingDuration);
    $("#progressBarTotalTime").html("<p>" + totalTimeLabel + "</p>");

}


displayEngineStateMachine.prototype.STShowingVideoEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "UPDATE_PROGRESS_BAR") {
        this.stateMachine.currentOffset = event["Offset"];
        this.stateMachine.recordingDuration = event["Duration"];
        this.updateProgressBarGraphics();
        return "HANDLED"
    }
    else if (event["EventType"] == "TUNE_LIVE_VIDEO") {
        stateData.nextState = this.stateMachine.stLiveVideo;
        return "TRANSITION";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "progress_bar":
                consoleLog("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++toggle the progress bar");
                this.calculateProgressBarParameters();
                this.toggleProgressBar(this.stateMachine.recordingDuration);
                break;
            case "clock":
                this.toggleClock(this.stateMachine.recordingDuration);
                break;
        }
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    // events to expect include
    else {
        consoleLog(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STLiveVideoEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        this.enteredChannel = "";
        this.channelDisplayed = false;
        this.channelEntryTimer = null;
        this.channelDisplayTimer = null;

        bsMessage.PostBSMessage({ command: "tuneLiveVideo" });
        return "HANDLED";
    }
    else if (event["EventType"] == "TUNE_LIVE_VIDEO_CHANNEL") {
        this.enteredChannel = event["EnteredChannel"];
        this.tuneLiveVideoChannel(true);
        this.displayChannel(this.lastTunedChannel.toString());
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        this.hideChannel();
        return "HANDLED";
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        consoleLog({ command: "debugPrint", "debugMessage": "STLiveVideoEventHandler: play recorded show" });
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"];
        consoleLog("STLiveVideoEventHandler: event=" + eventData);
        consoleLog("typeof event=" + typeof eventData);
        switch (eventData.toLowerCase()) {
            case "enter":
                if (this.channelEntryTimer != null) {
                    clearTimeout(this.channelEntryTimer);
                    this.channelEntryTimer = null;
                }
                if (this.enteredChannel != "") {
                    this.tuneLiveVideoChannel(true);
                }
                return "HANDLED";
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
            case "-":
                if (this.channelEntryTimer != null) {
                    clearTimeout(this.channelEntryTimer);
                    this.channelEntryTimer = null;
                }
                this.enteredChannel += eventData;
                this.displayChannel(this.enteredChannel.toString());
                console.log("enteredChannel = " + this.enteredChannel);
                this.startChannelEntryTimer();
                return "HANDLED";
            case "channel_up":
                var channelIndex = this.getChannelIdFromChannel(this.lastTunedChannel);
                channelIndex++;
                if (channelIndex >= this.tunerChannels.length) channelIndex = 0;
                this.enteredChannel = this.tunerChannels[channelIndex];
                consoleLog("channel_up - tune to " + this.enteredChannel);
                this.tuneLiveVideoChannel(true);
                this.displayChannel(this.lastTunedChannel.toString());
                return "HANDLED";
            case "channel_down":
                var channelIndex = this.getChannelIdFromChannel(this.lastTunedChannel);
                channelIndex--;
                if (channelIndex < 0) channelIndex = this.tunerChannels.length - 1;
                this.enteredChannel = this.tunerChannels[channelIndex];
                consoleLog("channel_down - tune to " + this.enteredChannel);
                this.tuneLiveVideoChannel(true);
                this.displayChannel(this.lastTunedChannel.toString());
                return "HANDLED";
            case "up":
                cycleHDMIInputs(true);
                return "HANDLED";
            case "down":
                cycleHDMIInputs(false);
                return "HANDLED";
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.displayChannel = function (channel) {

    var channelLabel = "Channel " + channel.toString();
    var htmlContents = '<p id="channel">' + channelLabel + '</p>';

    if (!$("#channel").length) {
        $("#videoControlRegion").append(htmlContents);
    }
    else {
        $("#channel").html(htmlContents);
    }
    $("#channel").stop(true);
    $("#channel").fadeTo(0, 1);
    $("#channel").show();
    this.startChannelDisplayTimer();
    this.channelDisplayed = true;
}


displayEngineStateMachine.prototype.hideChannel = function (channel) {

    if ($("#channel").length) {
        $("#channel").fadeOut(2000, this.fadedOut);
    }
}


displayEngineStateMachine.prototype.fadedOut = function() {
    console.log("fadedOut invoked");
    this.channelDisplayed = false;
}


displayEngineStateMachine.prototype.startChannelDisplayTimer = function () {

    if (this.channelDisplayTimer != null) {
        clearTimeout(this.channelDisplayTimer);
        this.channelDisplayTimer = null;
    }

    var thisObj = this;
    this.channelDisplayTimer = setTimeout(function () {
        thisObj.hideChannel();
    }, 2000);
}



displayEngineStateMachine.prototype.getChannelIdFromChannel = function (channel) {

    channel = standardizeStationNumber2(channel);
    for (i = 0; i < this.tunerChannels.length; i++) {
        if (this.tunerChannels[i] == channel) return i;
    }
    return 0;
}

displayEngineStateMachine.prototype.startChannelEntryTimer = function () {
    var thisObj = this;
    this.channelEntryTimer = setTimeout(function () {
        consoleLog("channelEntryTimer triggered");
        thisObj.tuneLiveVideoChannel(true);
    }, 2000);
}


displayEngineStateMachine.prototype.tuneLiveVideoChannel = function (saveChannelToDB) {
    consoleLog("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTune to " + this.enteredChannel);

    this.lastTunedChannel = this.enteredChannel;

    tuneChannel(this.enteredChannel, saveChannelToDB);

    this.enteredChannel = "";
}


displayEngineStateMachine.prototype.STPlayingEventHandler = function (event, stateData) {

    // events handled
    //      PAUSE
    //      FF
    //      RW
    //      INSTANT_REPLAY
    //      QUICK_SKIP
    //      MENU
    //      STOP
    //      RECORDED_SHOWS
    //      JUMP

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.stateMachine.ffCount = 1;
        this.stateMachine.rwCount = 1;
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        return "HANDLED"
    }
    else if (event["EventType"] == "MEDIA_END") {
        // executeRemoteCommand("pause");
        stateData.nextState = this.stateMachine.stPaused
        return "TRANSITION";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "pause":
                executeRemoteCommand("pause");
                TransportIconSingleton.getInstance().displayIcon(null, "pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "ff":
            case "fastforward":
                TransportIconSingleton.getInstance().displayIcon(null, "ff");
                stateData.nextState = this.stateMachine.stFastForwarding
                return "TRANSITION";
            case "rw":
            case "rewind":
                TransportIconSingleton.getInstance().displayIcon(null, "rw");
                stateData.nextState = this.stateMachine.stRewinding
                return "TRANSITION";
            case "instant_replay":
                TransportIconSingleton.getInstance().displayIcon(null, "instantReplay", this.stateMachine.miscIconDisplayTime);
                executeRemoteCommand("instantReplay");
                return "HANDLED";
            case "quick_skip":
                TransportIconSingleton.getInstance().displayIcon(null, "quickSkip", this.stateMachine.miscIconDisplayTime);
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "stop":
                consoleLog("STOP invoked when playing");
                executeRemoteCommand("pause");

                var event = {};
                event["EventType"] = "DISPLAY_DELETE_SHOW_DLG";
                event["Title"] = this.stateMachine.currentRecording.Title;
                event["RecordingId"] = this.stateMachine.currentRecording.RecordingId;
                postMessage(event);

                stateData.nextState = this.stateMachine.stIdle;
                return "TRANSITION";
            case "jump":
                this.jump();
                return "HANDLED";
        }
    }
    else {
        consoleLog(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.jump = function () {

    if (this.stateMachine.currentRecording == null) {
        consoleLog("no currentRecording");
        return;
    }

    if (this.stateMachine.priorSelectedRecording == null) {
        consoleLog("no priorSelectedRecording");
        return;
    }

    this.playSelectedShow(this.stateMachine.priorSelectedRecording.RecordingId);

}


displayEngineStateMachine.prototype.STPausedEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        this.stateMachine.ffCount = 1;
        this.stateMachine.rwCount = 1;
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
    // events to expect include
    //  PAUSE
    //  PLAY
    //  INSTANT_REPLAY
    //  QUICK_SKIP
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "pause":
            case "play":
                executeRemoteCommand("play");
                TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
                stateData.nextState = this.stateMachine.stPlaying
                return "TRANSITION";
            case "quick_skip":
                executeRemoteCommand("quickSkip");
                TransportIconSingleton.getInstance().displayIcon(null, "quickSkip", this.stateMachine.miscIconDisplayTime);
                return "HANDLED";
            case "instant_replay":
                executeRemoteCommand("instantReplay");
                TransportIconSingleton.getInstance().displayIcon(null, "instantReplay", this.stateMachine.miscIconDisplayTime);
                return "HANDLED";
        }
    }
    else {
        consoleLog(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STFastForwardingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        executeRemoteCommand("fastForward");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        TransportIconSingleton.getInstance().displayIcon(null, "quickSkip", this.stateMachine.miscIconDisplayTime);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
        // events to expect include
    //  FF
    //  PLAY
    //  PAUSE
    //  INSTANT_REPLAY
    //  QUICK_SKIP
    //  MENU
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "play":
                executeRemoteCommand("play");
                TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
                stateData.nextState = this.stateMachine.stPlaying;
                return "TRANSITION";
            case "pause":
                executeRemoteCommand("pause");
                TransportIconSingleton.getInstance().displayIcon(null, "pause");
                stateData.nextState = this.stateMachine.stPaused;
                return "TRANSITION";
            case "ff":
            case "fastforward":
                executeRemoteCommand("nextFastForward");
                this.stateMachine.ffCount++;
                if (this.stateMachine.ffCount > this.stateMachine.maxFFCount) {
                    this.stateMachine.ffCount = 1;
                }
                var prefix = null;
                if (this.stateMachine.ffCount > 1) {
                    prefix = this.stateMachine.ffCount.toString();
                }
                TransportIconSingleton.getInstance().displayIcon(prefix, "ff");
                return "HANDLED"
            case "instant_replay":
                // TODO
                //executeRemoteCommand("instantReplay");
                //return "HANDLED";
            case "quick_skip":
                consoleLog("-------------------------------------------------------------------------------- invoked FORWARD_TO_TICK");
                consoleLog("numTicks=" + this.stateMachine.numTicks);
                consoleLog("minutesPerTick=" + this.stateMachine.minutesPerTick);
                consoleLog("currentOffset=" + this.stateMachine.currentOffset);
                consoleLog("recordingDuration=" + this.stateMachine.recordingDuration);

                consoleLog("STFastForwardingEventHandler: QUICK_SKIP received.");
                bsMessage.PostBSMessage({ command: "forwardToTick", "offset": this.stateMachine.currentOffset, "duration": this.stateMachine.recordingDuration, "numTicks": this.stateMachine.numTicks, "minutesPerTick": this.stateMachine.minutesPerTick });
                TransportIconSingleton.getInstance().displayIcon(null, "quickSkip", this.stateMachine.miscIconDisplayTime);
                return "HANDLED";
            case "menu":
                // TODO
                return "HANDLED";
        }
    }
    else {
        consoleLog(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STRewindingEventHandler = function (event, stateData) {
    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");
        executeRemoteCommand("rewind");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
        // events to expect include
        //  RW
        //  PLAY
        //  PAUSE
        //  INSTANT_REPLAY
        //  QUICK_SKIP
        //  MENU
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "play":
                executeRemoteCommand("play");
                TransportIconSingleton.getInstance().displayIcon(null, "play", this.stateMachine.playIconDisplayTime);
                stateData.nextState = this.stateMachine.stPlaying;
                return "TRANSITION";
            case "pause":
                executeRemoteCommand("pause");
                TransportIconSingleton.getInstance().displayIcon(null, "pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "rw":
            case "rewind":
                executeRemoteCommand("nextRewind");
                this.stateMachine.rwCount++;
                if (this.stateMachine.rwCount > this.stateMachine.maxRWCount) {
                    this.stateMachine.rwCount = 1;
                }
                var prefix = null;
                if (this.stateMachine.rwCount > 1) {
                    prefix = this.stateMachine.rwCount.toString();
                }
                TransportIconSingleton.getInstance().displayIcon(prefix, "rw");
                return "HANDLED"
            case "instant_replay":
                bsMessage.PostBSMessage({ command: "backToTick", "offset": this.stateMachine.currentOffset, "duration": this.stateMachine.recordingDuration, "numTicks": this.stateMachine.numTicks, "minutesPerTick": this.stateMachine.minutesPerTick });
                TransportIconSingleton.getInstance().displayIcon(null, "instantReplay", this.stateMachine.miscIconDisplayTime);
                return "HANDLED";
            case "quick_skip":
                // TODO
                //executeRemoteCommand("quickSkip");
                //return "HANDLED";
            case "menu":
            // TODO
                return "HANDLED";
        }
    }
    else {
        consoleLog(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}
