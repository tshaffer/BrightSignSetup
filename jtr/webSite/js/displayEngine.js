function displayEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.InitialPseudoStateHandler = this.InitializeDisplayEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stShowingUI = new HState(this, "ShowingUI");
    this.stShowingUI.HStateEventHandler = this.STShowingUIEventHandler;
    this.stShowingUI.superState = this.stTop;
    this.stShowingUI.getAction = this.getAction;
    this.stShowingUI.playSelectedShow = this.playSelectedShow;

    this.stShowingModalDlg = new HState(this, "ShowingModalDlg");
    this.stShowingModalDlg.HStateEventHandler = this.STShowingModalDlgEventHandler;
    this.stShowingModalDlg.superState = this.stTop;

    this.stShowingVideo = new HState(this, "ShowingVideo");
    this.stShowingVideo.HStateEventHandler = this.STShowingVideoEventHandler;
    this.stShowingVideo.superState = this.stTop;
    this.stShowingVideo.calculateProgressBarParameters = this.calculateProgressBarParameters;
    this.stShowingVideo.toggleProgressBar = this.toggleProgressBar;
    this.stShowingVideo.updateProgressBarGraphics = this.updateProgressBarGraphics;
    
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

    console.log("InitializeDisplayEngineHSM invoked");

    this.currentRecording = null;
    this.priorSelectedRecording = null;

    return this.stShowingUI;
}


displayEngineStateMachine.prototype.STShowingUIEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events
        //      API - from browser or other external app
        //          Play a specific recording - PLAY_RECORDED_SHOW
        //          Delete a specific recording - DELETE_RECORDED_SHOW
        //      Remote Control - note: 'remote commands' coming from API are indistinguishable from actual remote control commands on the device
        //          Menu, recorded_shows?, up, down, left, right, select
        //          Trick mode keys are ignored in this state
    // TODO - should support PLAY if a show is highlighted
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
        stateData.nextState = this.stateMachine.stPlaying
        return "TRANSITION"
    }
    else if (event["EventType"] == "DELETE_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        executeDeleteSelectedShow(recordingId);
        return "HANDLED"
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                console.log("selectHomePage");
                selectHomePage();
                $("#footerArea").removeAttr("style");
                // $("#footerArea").css("display", "block");

                // give focus to first element
                var elementId = "#" + mainMenuIds[0][0];
                $(elementId).focus();
                return "HANDLED";
                break;
            case "recorded_shows":
                selectRecordedShows();
                return "HANDLED";
                break;
            case "up":
            case "down":
            case "left":
            case "right":
                var command = eventData.toLowerCase();
                console.log("currentActiveElementId is " + currentActiveElementId);
                switch (currentActiveElementId) {
                    case "#homePage":
                        console.log("navigation remote key pressed while homePage visible");
                        navigateHomePage(command)
                        break;
                    case "#recordedShowsPage":
                        console.log("navigation remote key pressed while recordedShowsPage visible");
                        navigateRecordedShowsPage(command)
                        break;
                }
                return "HANDLED";
                break;
            case "exit":
                // TODO
                // what state to transfer to? paused? playing? - assume paused for now
                eraseUI();
                stateData.nextState = this.stateMachine.stPaused;
                return "TRANSITION";
            case "select":
                switch (currentActiveElementId) {
                    case "#homePage":
                        var currentElement = document.activeElement;
                        var currentElementId = currentElement.id;
                        console.log("active home page item is " + currentElementId);
                        switch (currentElementId) {
                            case "channelGuide":
                                selectChannelGuide();
                                break;
                            case "setManualRecord":
                                selectSetManualRecord();
                                break;
                            case "recordedShows":
                                selectRecordedShows();
                                break;
                            case "userSelection":
                                selectUserSelection();
                                break;
                            case "toDoList":
                                selectToDoList();
                                break;
                            case "myPlayVideo":
                                break;
                        }
                        break;
                    case "#recordedShowsPage":
                        var currentElement = document.activeElement;
                        var currentElementId = currentElement.id;
                        console.log("active recorded shows page item is " + currentElementId);

                        var action = this.getAction(currentElementId);
                        if (action != "") {
                            var recordingId = currentElementId.substring(action.length);
                            switch (action) {
                                case "recording":
                                    if (recordingId in _currentRecordings) {
                                        this.playSelectedShow(recordingId);
                                        stateData.nextState = this.stateMachine.stPlaying
                                        return "TRANSITION"
                                    }
                                    break;
                                case "delete":
                                    executeDeleteSelectedShow(recordingId);
                                    getRecordedShows();
                                    break;
                            }
                        }

                        return "HANDLED"

                        break;
                }
                break;
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.playSelectedShow = function (recordingId) {

    console.log("playSelectedShow " + recordingId);

    // if there's a current recording, save it for later possible jump
    this.stateMachine.priorSelectedRecording = this.stateMachine.currentRecording;

    // set new recording
    this.stateMachine.currentRecording = _currentRecordings[recordingId];

    // save lastSelectedShowId in server's persistent memory
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



displayEngineStateMachine.prototype.getAction = function (actionButtonId) {
    if (actionButtonId.lastIndexOf("recording") === 0) {
        return "recording";
    }
    else if (actionButtonId.lastIndexOf("delete") === 0) {
        return "delete";
    }
    console.log("getAction - no matching action found for " + actionButtonId);
    return "";
}


displayEngineStateMachine.prototype.STShowingModalDlgEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        // TBD - is it necessary to do anything here? hide video? send message to js?
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "up":
            case "down":
            case "left":
            case "right":
                console.log("navigation key invoked while modal dialog displayed");

                // temporary code; make it more general purpose when a second dialog is added
                console.log("selected element was: " + selectedDeleteShowDlgElement);

                $(selectedDeleteShowDlgElement).removeClass("btn-primary");
                $(selectedDeleteShowDlgElement).addClass("btn-secondary");

                $(unselectedDeleteShowDlgElement).removeClass("btn-secondary");
                $(unselectedDeleteShowDlgElement).addClass("btn-primary");

                $(unselectedDeleteShowDlgElement).focus();

                var tmp = unselectedDeleteShowDlgElement;
                unselectedDeleteShowDlgElement = selectedDeleteShowDlgElement;
                selectedDeleteShowDlgElement = tmp;

                return "HANDLED";
                break;
            case "select":
                console.log("enter key invoked while modal dialog displayed");

                // temporary code; make it more general purpose when a second dialog is added
                if (selectedDeleteShowDlgElement == "#deleteShowDlgDelete") {
                    deleteShowDlgDeleteInvoked();
                }
                else {
                    deleteShowDlgCloseInvoked();
                }

                stateData.nextState = this.stateMachine.stShowingUI;
                return "TRANSITION";

            case "exit":
                deleteShowDlgCloseInvoked();

                stateData.nextState = this.stateMachine.stShowingUI;
                return "TRANSITION";

        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
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

    console.log("toggleProgressBar: duration = " + this.stateMachine.currentRecording.Duration);
    console.log("toggleProgressBar: numMinutes = " + this.stateMachine.numMinutes);

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

    console.log("toggleProgressBar: numTicks = " + this.stateMachine.numTicks);
    console.log("toggleProgressBar: minutesPerTick = " + this.stateMachine.minutesPerTick);

    // determine whether or not to draw last tick - don't draw it if it is at the end of the progress bar
    if (Math.floor(this.stateMachine.numMinutes) % (Math.floor(this.stateMachine.minutesPerTick) * this.stateMachine.numTicks) == 0) {
        this.stateMachine.numTicks--;
    }
    console.log("toggleProgressBar: numTicks = " + this.stateMachine.numTicks);
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

            console.log("tickOffset=" + tickOffset.toString());
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

    // currentOffset in seconds
    console.log('### currentOffset : ' + this.stateMachine.currentOffset);

    // duration in seconds
    console.log('### recordingDuration : ' + this.stateMachine.recordingDuration);

    var percentCompleteVal = (this.stateMachine.currentOffset / this.stateMachine.recordingDuration * 100);
    var percentComplete = percentCompleteVal.toString() + "%";
    console.log("percentComplete = " + percentComplete);

    $("#progressBarSpan").width(percentComplete);

    // TODO - should retrieve these attributes dynamically
    var leftOffset = 5.5;
    var rightOffset = 89.6;
    var offset = leftOffset + (rightOffset - leftOffset) * (this.stateMachine.currentOffset / this.stateMachine.recordingDuration);
    console.log("offset = " + offset);

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
    //console.log("currentOffset is " + currentOffset + ", elapsedTimeLabel is " + elapsedTimeLabel);

    // TODO - should only need to do this when progress bar is first updated with a recording
    var totalTimeLabel = SecondsToHourMinuteLabel(this.stateMachine.recordingDuration);
    $("#progressBarTotalTime").html("<p>" + totalTimeLabel + "</p>");

}


displayEngineStateMachine.prototype.STShowingVideoEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "UPDATE_PROGRESS_BAR") {
        this.stateMachine.currentOffset = event["Offset"];
        this.stateMachine.recordingDuration = event["Duration"];
        this.updateProgressBarGraphics();
        return "HANDLED"
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                console.log("display the main menu");

                // TODO - undisplay overlay graphics (progress bar. anything else?)

                selectHomePage();
                $("#footerArea").removeAttr("style");
                // $("#footerArea").css("display", "block");

                // give focus to first element
                var elementId = "#" + mainMenuIds[0][0];
                $(elementId).focus();

                stateData.nextState = this.stateMachine.stShowingUI
                return "TRANSITION";

                break;
            case "recorded_shows":
                selectRecordedShows();
                stateData.nextState = this.stateMachine.stShowingUI
                return "TRANSITION";
                break;
            case "progress_bar":
                console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++toggle the progress bar");
                this.calculateProgressBarParameters();
                this.toggleProgressBar(this.stateMachine.recordingDuration);
                break;

        }
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    // events to expect include
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
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
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
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
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "pause":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "ff":
            case "fastforward":
                stateData.nextState = this.stateMachine.stFastForwarding
                return "TRANSITION";
            case "rw":
            case "rewind":
                stateData.nextState = this.stateMachine.stRewinding
                return "TRANSITION";
            case "instant_replay":
                executeRemoteCommand("instantReplay");
                return "HANDLED";
            case "quick_skip":
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "menu":
                // TODO
            case "stop":
                console.log("STOP invoked when playing");
                executeRemoteCommand("pause");
                displayDeleteShowDlg(this.stateMachine.currentRecording.Title, this.stateMachine.currentRecording.RecordingId);
                stateData.nextState = this.stateMachine.stShowingModalDlg
                return "TRANSITION";
            case "jump":
                this.jump();
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.jump = function () {

    if (this.stateMachine.currentRecording == null) {
        console.log("no currentRecording");
        return;
    }

    if (this.stateMachine.priorSelectedRecording == null) {
        console.log("no priorSelectedRecording");
        return;
    }

    this.playSelectedShow(this.stateMachine.priorSelectedRecording.RecordingId);

}

displayEngineStateMachine.prototype.STPausedEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
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
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "pause":
            case "play":
                executeRemoteCommand("play");
                stateData.nextState = this.stateMachine.stPlaying
                return "TRANSITION";
            case "quick_skip":
                executeRemoteCommand("quickSkip");
                return "HANDLED";
            case "instant_replay":
                executeRemoteCommand("instantReplay");
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STFastForwardingEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        executeRemoteCommand("fastForward");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
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
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "play":
                executeRemoteCommand("play");
                stateData.nextState = this.stateMachine.stPlaying;
                return "TRANSITION";
            case "pause":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused;
                return "TRANSITION";
            case "ff":
            case "fastforward":
                executeRemoteCommand("nextFastForward");
                return "HANDLED"
            case "instant_replay":
                // TODO
                //executeRemoteCommand("instantReplay");
                //return "HANDLED";
            case "quick_skip":
                console.log("-------------------------------------------------------------------------------- invoked FORWARD_TO_TICK");
                console.log("numTicks=" + this.stateMachine.numTicks);
                console.log("minutesPerTick=" + this.stateMachine.minutesPerTick);
                console.log("currentOffset=" + this.stateMachine.currentOffset);
                console.log("recordingDuration=" + this.stateMachine.recordingDuration);

                console.log("STFastForwardingEventHandler: QUICK_SKIP received.");
                bsMessage.PostBSMessage({ command: "forwardToTick", "offset": this.stateMachine.currentOffset, "duration": this.stateMachine.recordingDuration, "numTicks": this.stateMachine.numTicks, "minutesPerTick": this.stateMachine.minutesPerTick });
                return "HANDLED";
            case "menu":
                // TODO
                return "HANDLED";
        }
    }
    else {
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


displayEngineStateMachine.prototype.STRewindingEventHandler = function (event, stateData) {
    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");
        executeRemoteCommand("rewind");
        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "PLAY_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        this.playSelectedShow(recordingId);
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
        console.log(this.id + ": remote command input: " + eventData);
        switch (eventData.toLowerCase()) {
            case "play":
                executeRemoteCommand("play");
                stateData.nextState = this.stateMachine.stPlaying;
                return "TRANSITION";
            case "pause":
                executeRemoteCommand("pause");
                stateData.nextState = this.stateMachine.stPaused
                return "TRANSITION";
            case "rw":
            case "rewind":
                executeRemoteCommand("nextRewind");
                return "HANDLED"
            case "instant_replay":
                bsMessage.PostBSMessage({ command: "backToTick", "offset": this.stateMachine.currentOffset, "duration": this.stateMachine.recordingDuration, "numTicks": this.stateMachine.numTicks, "minutesPerTick": this.stateMachine.minutesPerTick });
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
        console.log(this.id + ": signal type = " + event["EventType"]);
    }

    stateData.nextState = this.superState;
    return "SUPER";
}



