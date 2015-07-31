function uiEngineStateMachine() {

    HSM.call(this); //call super constructor.

    this.recordIconDisplayTime = 1500;

    this.InitialPseudoStateHandler = this.InitializeUIEngineHSM;

    this.stTop = new HState(this, "Top");
    this.stTop.HStateEventHandler = STTopEventHandler;

    this.stNone = new HState(this, "None");
    this.stNone.HStateEventHandler = this.STNoneEventHandler;
    this.stNone.superState = this.stTop;

    this.stUIScreen = new HState(this, "UIScreen");
    this.stUIScreen.HStateEventHandler = this.STUIScreenEventHandler;
    this.stUIScreen.superState = this.stTop;

    this.stMainMenu = new HState(this, "MainMenu");
    this.stMainMenu.HStateEventHandler = this.STMainMenuEventHandler;
    this.stMainMenu.superState = this.stUIScreen;
    this.stMainMenu.navigateHomePage = this.navigateHomePage;

    this.stShowingModalDlg = new HState(this, "ShowingModalDlg");
    this.stShowingModalDlg.HStateEventHandler = this.STShowingModalDlgEventHandler;
    this.stShowingModalDlg.superState = this.stTop;

    this.stShowingCGProgramModalDlg = new HState(this, "ShowingCGProgramModalDlg");
    this.stShowingCGProgramModalDlg.HStateEventHandler = this.STShowingCGProgramModalDlgEventHandler;
    this.stShowingCGProgramModalDlg.superState = this.stTop;

    this.stRecordedShows = new HState(this, "RecordedShows");
    this.stRecordedShows.HStateEventHandler = this.STRecordedShowsEventHandler;
    this.stRecordedShows.superState = this.stUIScreen;
    this.stRecordedShows.getAction = this.getAction;
    this.stRecordedShows.navigateRecordedShowsPage = this.navigateRecordedShowsPage;

    this.stChannelGuide = new HState(this, "ChannelGuide");
    this.stChannelGuide.HStateEventHandler = this.STChannelGuideEventHandler;
    this.stChannelGuide.superState = this.stUIScreen;
    
    this.topState = this.stTop;
}

//subclass extends superclass
uiEngineStateMachine.prototype = Object.create(HSM.prototype);
uiEngineStateMachine.prototype.constructor = uiEngineStateMachine;


uiEngineStateMachine.prototype.InitializeUIEngineHSM = function () {

    consoleLog("InitializeUIEngineHSM invoked");

    this.currentRecording = null;
    this.priorSelectedRecording = null;

    return this.stMainMenu;
}


uiEngineStateMachine.prototype.STNoneEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        TransportIconSingleton.getInstance().eraseIcon();
        return "HANDLED";
    }
    else if (event["EventType"] == "DISPLAY_DELETE_SHOW_DLG") {
        var title = event["Title"];
        var recordingId = event["RecordingId"];
        displayDeleteShowDlg(title, recordingId);
        stateData.nextState = this.stateMachine.stShowingModalDlg;
        return "TRANSITION";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                stateData.nextState = this.stateMachine.stMainMenu;
                return "TRANSITION";
            case "guide":
                stateData.nextState = this.stateMachine.stChannelGuide;
                return "TRANSITION";
            case "recorded_shows":
                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";
        }
    }
    // TODO - other states as well?
    else if (event["EventType"] == "DELETE_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        executeDeleteSelectedShow(recordingId);
        //getRecordedShows();       // TODO - is this required to get the data structure updated?
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


uiEngineStateMachine.prototype.STUIScreenEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        //eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            // swallow the following keys so that they're not used by displayEngine
            case "ff":
            case "fastforward":
            case "rw":
            case "rewind":
            case "jump":
            case "instant_replay":
            case "quick_skip":
            case "progress_bar":
            case "clock":
                return "HANDLED";
        }
    }
    else if (event["EventType"] == "DELETE_RECORDED_SHOW") {
        var recordingId = event["EventData"];
        executeDeleteSelectedShow(recordingId);
        //getRecordedShows();       // TODO - is this required to get the data structure updated?
    }

    stateData.nextState = this.superState;
    return "SUPER";
}



uiEngineStateMachine.prototype.STShowingCGProgramModalDlgEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        return "HANDLED";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "up":
                cgProgramDlgUp();
                return "HANDLED";
            case "down":
                cgProgramDlgDown();
                return "HANDLED";
            case "select":
                functionInvoked = cgSelectEventHandler();

                switch (functionInvoked) {
                    case "record":
                        // mark the recorded show?
                        // just return to channel guide
                        ChannelGuideSingleton.getInstance().resetSelectedProgram = false;
                        stateData.nextState = this.stateMachine.stChannelGuide;
                        return "TRANSITION";
                    case "tune":
                        stateData.nextState = this.stateMachine.stNone;
                        return "TRANSITION";
                    case "close":
                        ChannelGuideSingleton.getInstance().resetSelectedProgram = false;
                        stateData.nextState = this.stateMachine.stChannelGuide;
                        return "TRANSITION";
                }
            case "exit":
                cgProgramDlgCloseInvoked();
                ChannelGuideSingleton.getInstance().resetSelectedProgram = false;
                stateData.nextState = this.stateMachine.stChannelGuide;
                return "TRANSITION";

            // swallow the following keys so that they're not used by displayEngine
            case "left":
            case "right":
            case "play":
            case "pause":
            case "ff":
            case "fastforward":
            case "rw":
            case "rewind":
            case "jump":
            case "instant_replay":
            case "quick_skip":
            case "progress_bar":
            case "clock":
                return "HANDLED";

        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


uiEngineStateMachine.prototype.STShowingModalDlgEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        return "HANDLED";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "up":
            case "down":
            case "left":
            case "right":
                consoleLog("navigation key invoked while modal dialog displayed");

                // temporary code; make it more general purpose when a second dialog is added
                consoleLog("selected element was: " + selectedDeleteShowDlgElement);

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
                consoleLog("enter key invoked while modal dialog displayed");

                // temporary code; make it more general purpose when a second dialog is added
                if (selectedDeleteShowDlgElement == "#deleteShowDlgDelete") {
                    deleteShowDlgDeleteInvoked();
                }
                else {
                    deleteShowDlgCloseInvoked();
                }

                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";

            case "exit":
                deleteShowDlgCloseInvoked();

                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";

            // swallow the following keys so that they're not used by displayEngine
            case "play":
            case "pause":
            case "ff":
            case "fastforward":
            case "rw":
            case "rewind":
            case "jump":
            case "instant_replay":
            case "quick_skip":
            case "progress_bar":
            case "clock":
                return "HANDLED";

        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}



// comments transferred from displayEngine.js - need updating
// events
//      API - from browser or other external app
//          Play a specific recording - PLAY_RECORDED_SHOW
//          Delete a specific recording - DELETE_RECORDED_SHOW
//      Remote Control - note: 'remote commands' coming from API are indistinguishable from actual remote control commands on the device
//          Menu, recorded_shows?, up, down, left, right, select
//          Trick mode keys are ignored in this state
// TODO - should support PLAY if a show is highlighted when Replay Guide is visible

uiEngineStateMachine.prototype.STMainMenuEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        selectHomePage();
        $("#footerArea").css("display", "none");

        // give focus to first element
        var elementId = "#" + mainMenuIds[0][0];
        $(elementId).focus();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                return "HANDLED";
            case "guide":
                stateData.nextState = this.stateMachine.stChannelGuide;
                return "TRANSITION";
            case "recorded_shows":
                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";
            case "up":
            case "down":
            case "left":
            case "right":
                var command = eventData.toLowerCase();
                consoleLog("currentActiveElementId is " + currentActiveElementId);
                consoleLog("navigation remote key pressed while homePage visible");
                this.navigateHomePage(command)
                return "HANDLED";
                break;
            case "exit":
                stateData.nextState = this.stateMachine.stNone;
                return "TRANSITION";
            case "select":
                var currentElement = document.activeElement;
                var currentElementId = currentElement.id;
                consoleLog("active home page item is " + currentElementId);
                switch (currentElementId) {
                    case "channelGuide":
                        stateData.nextState = this.stateMachine.stChannelGuide;
                        return "TRANSITION";
                    case "manualRecord":
                //        selectManualRecord();
                //        break;
                    case "recordedShows":
                        stateData.nextState = this.stateMachine.stRecordedShows;
                        return "TRANSITION";
                    case "liveVideo":
                        consoleLog("Post TUNE_LIVE_VIDEO message");
                        var event = {};
                        event["EventType"] = "TUNE_LIVE_VIDEO";
                        postMessage(event);

                        // after the device transitions to live video, it will get the last tuned channel and tune to it
                        var url = baseURL + "lastTunedChannel";
                        $.get(url)
                            .done(function (result) {
                                consoleLog("lastTunedChannel successfully retrieved");
                                var event = {};
                                event["EventType"] = "TUNE_LIVE_VIDEO_CHANNEL";
                                event["EnteredChannel"] = result;
                                postMessage(event);
                            })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                debugger;
                                consoleLog("lastTunedChannel failure");
                            })
                            .always(function () {
                                //alert("recording transmission finished");
                            });

                        stateData.nextState = this.stateMachine.stNone;
                        return "TRANSITION";
                    case "settings":
                        selectSettingsPage();
                        break;
                    //case "toDoList":
                //        selectToDoList();
                //        break;
                //    case "myPlayVideo":
                //        break;
                }
                break;
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


uiEngineStateMachine.prototype.getAction = function (actionButtonId) {
    if (actionButtonId.lastIndexOf("recording") === 0) {
        return "recording";
    }
    else if (actionButtonId.lastIndexOf("delete") === 0) {
        return "delete";
    }
    consoleLog("getAction - no matching action found for " + actionButtonId);
    return "";
}


uiEngineStateMachine.prototype.STChannelGuideEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        ChannelGuideSingleton.getInstance().selectChannelGuide();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
        ChannelGuideSingleton.getInstance().resetSelectedProgram = true;
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                stateData.nextState = this.stateMachine.stMainMenu;
                return "TRANSITION";
            case "recorded_shows":
                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";
            case "guide":
                //stateData.nextState = this.stateMachine.stChannelGuide;
                //return "TRANSITION";
                // ????
                return "HANDLED";
            case "up":
            case "down":
            case "left":
            case "right":
                ChannelGuideSingleton.getInstance().navigateChannelGuide(eventData.toLowerCase());
                return "HANDLED";
            case "highest_speed_rw":
                ChannelGuideSingleton.getInstance().navigateBackwardOneDay();
                return "HANDLED";
            case "prev":
                ChannelGuideSingleton.getInstance().navigateBackwardOneScreen();
                return "HANDLED";
            case "next":
                ChannelGuideSingleton.getInstance().navigateForwardOneScreen();
                return "HANDLED";
            case "highest_speed_fw":
                ChannelGuideSingleton.getInstance().navigateForwardOneDay();
                return "HANDLED";
            case "exit":
                stateData.nextState = this.stateMachine.stNone;
                return "TRANSITION";
            case "select":
                displayCGPopUp();
                stateData.nextState = this.stateMachine.stShowingCGProgramModalDlg;
                return "TRANSITION";
            case "record":
                TransportIconSingleton.getInstance().displayIcon(null, "record", this.stateMachine.recordIconDisplayTime);
                cgRecordSelectedProgram();
                return "HANDLED";
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}

uiEngineStateMachine.prototype.STRecordedShowsEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        consoleLog(this.id + ": entry signal");

        selectRecordedShows();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        consoleLog(this.id + ": exit signal");
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        consoleLog(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                stateData.nextState = this.stateMachine.stMainMenu;
                return "TRANSITION";
            case "guide":
                stateData.nextState = this.stateMachine.stChannelGuide;
                return "TRANSITION";
            case "recorded_shows":
                return "HANDLED";
            case "up":
            case "down":
            case "left":
            case "right":
                var command = eventData.toLowerCase();
                consoleLog("currentActiveElementId is " + currentActiveElementId);
                consoleLog("navigation remote key pressed while recordedShowsPage visible");
                this.navigateRecordedShowsPage(command)
                return "HANDLED";
            case "exit":
                stateData.nextState = this.stateMachine.stNone;
                return "TRANSITION";
            case "guide":
                stateData.nextState = this.stateMachine.stChannelGuide;
                return "TRANSITION";
            case "select":
                var currentElement = document.activeElement;
                var currentElementId = currentElement.id;
                consoleLog("active recorded shows page item is " + currentElementId);

                var action = this.getAction(currentElementId);
                if (action != "") {
                    var recordingId = currentElementId.substring(action.length);
                    switch (action) {
                        case "recording":
                            consoleLog({ command: "debugPrint", "debugMessage": "STRecordedShowsEventHandler: PLAY_RECORDED_SHOW, recordingId=" + recordingId });
                            if (recordingId in _currentRecordings) {

                                var event = {};
                                event["EventType"] = "PLAY_RECORDED_SHOW";
                                event["EventData"] = recordingId;
                                postMessage(event);

                                stateData.nextState = this.stateMachine.stNone;
                                return "TRANSITION"
                            }
                            break;
                        case "delete":
                            executeDeleteSelectedShow(recordingId);
                            getRecordedShows();
                            break;
                    }
                }
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


// home page
var mainMenuIds = [
    ['recordedShows', 'liveVideo'],
    ['recordNow', 'channelGuide'],
    ['manualRecord', 'toDoList'],
    ['', 'settings']
];

uiEngineStateMachine.prototype.navigateHomePage = function (navigationCommand$) {

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    for (i = 0; i < mainMenuIds.length; i++) {
        for (j = 0; j < mainMenuIds[i].length; j++) {
            if (mainMenuIds[i][j] == currentElementId) {
                rowIndex = i;
                colIndex = j;
                break;
            }
            // break again if necessary?
        }
    }

    if (rowIndex >= 0 && colIndex >= 0) {
        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < mainMenuIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < mainMenuIds[0].length) colIndex++;
                break;
        }
    }
    else {
        rowIndex = 0;
        colIndex = 0;
    }

    consoleLog("currentElementId is " + currentElementId);

    var newElementId = "#" + mainMenuIds[rowIndex][colIndex];

    $("#" + currentElementId).removeClass("btn-primary");
    $("#" + currentElementId).addClass("btn-secondary");

    $(newElementId).removeClass("btn-secondary");
    $(newElementId).addClass("btn-primary");

    $(newElementId).focus();
}

uiEngineStateMachine.prototype.navigateRecordedShowsPage = function (navigationCommand$) {

    consoleLog("navigateRecordedShowsPage entry");

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    if (currentElementId == "" || currentElementId == "recordedShows") {
        rowIndex = 0;
        colIndex = 0;
    }
    else {
        currentElementId = "#" + currentElementId;
        for (i = 0; i < recordedPageIds.length; i++) {

            var recordingId = recordedPageIds[i][0];
            var deleteId = recordedPageIds[i][1];

            if (recordingId == currentElementId) {
                rowIndex = i;
                colIndex = 0;
                break;
            }
            else if (deleteId == currentElementId) {
                rowIndex = i;
                colIndex = 1;
                break;
            }
        }

        switch (navigationCommand$) {
            case "up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "down":
                if (rowIndex < recordedPageIds.length) rowIndex++;
                break;
            case "left":
                if (colIndex > 0) colIndex--;
                break;
            case "right":
                if (colIndex < 1) colIndex++;
                break;
        }
    }

    $(recordedPageIds[rowIndex][colIndex]).focus();
}


var userMessageDisplayed = false;
var userMessageTimer = null;

displayUserMessage = function (userMessage) {

    var htmlContents = '<p id="userMessage">' + userMessage + '</p>';

    if (!$("#userMessage").length) {
        $("#videoControlRegion").append(htmlContents);
    }
    else {
        $("#userMessage").html(htmlContents);
    }
    $("#userMessage").stop(true);
    $("#userMessage").fadeTo(0, 1);
    $("#userMessage").show();
    startUserMessageTimer();
    userMessageDisplayed = true;
}


hideUserMessage = function () {

    if ($("#userMessage").length) {
        $("#userMessage").fadeOut(2000, userMessageFadedOut);
    }
}


userMessageFadedOut = function () {
    console.log("userMessageFadedOut invoked");
    userMessageDisplayed = false;
}


startUserMessageTimer = function () {

    if (userMessageTimer != null) {
        clearTimeout(userMessageTimer);
        userMessageTimer = null;
    }

    userMessageTimer = setTimeout(function () {
        hideUserMessage();
    }, 5000);
}

