function uiEngineStateMachine() {

    HSM.call(this); //call super constructor.

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

    this.stShowingModalDlg = new HState(this, "ShowingModalDlg");
    this.stShowingModalDlg.HStateEventHandler = this.STShowingModalDlgEventHandler;
    this.stShowingModalDlg.superState = this.stTop;

    this.stRecordedShows = new HState(this, "RecordedShows");
    this.stRecordedShows.HStateEventHandler = this.STRecordedShowsEventHandler;
    this.stRecordedShows.superState = this.stUIScreen;
    this.stRecordedShows.getAction = this.getAction;

    this.topState = this.stTop;
}

//subclass extends superclass
uiEngineStateMachine.prototype = Object.create(HSM.prototype);
uiEngineStateMachine.prototype.constructor = uiEngineStateMachine;


uiEngineStateMachine.prototype.InitializeUIEngineHSM = function () {

    console.log("InitializeUIEngineHSM invoked");

    this.currentRecording = null;
    this.priorSelectedRecording = null;

    return this.stMainMenu;
}


uiEngineStateMachine.prototype.STNoneEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
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
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                stateData.nextState = this.stateMachine.stMainMenu;
                return "TRANSITION";
            case "recorded_shows":
                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}


uiEngineStateMachine.prototype.STUIScreenEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
        return "HANDLED";
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

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
                return "HANDLED";
        }
    }

    stateData.nextState = this.superState;
    return "SUPER";
}



uiEngineStateMachine.prototype.STShowingModalDlgEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        eraseUI();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        return "HANDLED";
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
        console.log(this.id + ": entry signal");

        selectHomePage();
        $("#footerArea").css("display", "none");

        // give focus to first element
        var elementId = "#" + mainMenuIds[0][0];
        $(elementId).focus();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                return "HANDLED";
            case "recorded_shows":
                stateData.nextState = this.stateMachine.stRecordedShows;
                return "TRANSITION";
            case "up":
            case "down":
            case "left":
            case "right":
                var command = eventData.toLowerCase();
                console.log("currentActiveElementId is " + currentActiveElementId);
                console.log("navigation remote key pressed while homePage visible");
                navigateHomePage(command)
                return "HANDLED";
                break;
            case "exit":
                stateData.nextState = this.stateMachine.stNone;
                return "TRANSITION";
            case "select":
                var currentElement = document.activeElement;
                var currentElementId = currentElement.id;
                console.log("active home page item is " + currentElementId);
                switch (currentElementId) {
                    //case "channelGuide":
                //        selectChannelGuide();
                //        break;
                //    case "setManualRecord":
                //        selectSetManualRecord();
                //        break;
                    case "recordedShows":
                        stateData.nextState = this.stateMachine.stRecordedShows;
                        return "TRANSITION";
                    //case "userSelection":
                //        selectUserSelection();
                //        break;
                //    case "toDoList":
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
    console.log("getAction - no matching action found for " + actionButtonId);
    return "";
}


uiEngineStateMachine.prototype.STRecordedShowsEventHandler = function (event, stateData) {

    stateData.nextState = null;

    if (event["EventType"] == "ENTRY_SIGNAL") {
        console.log(this.id + ": entry signal");

        selectRecordedShows();

        return "HANDLED";
    }
    else if (event["EventType"] == "EXIT_SIGNAL") {
        console.log(this.id + ": exit signal");
    }
    else if (event["EventType"] == "REMOTE") {
        var eventData = event["EventData"]
        console.log(this.id + ": remote command input: " + eventData);

        switch (eventData.toLowerCase()) {
            case "menu":
                stateData.nextState = this.stateMachine.stMainMenu;
                return "TRANSITION";
            case "recorded_shows":
                return "HANDLED";
            case "up":
            case "down":
            case "left":
            case "right":
                var command = eventData.toLowerCase();
                console.log("currentActiveElementId is " + currentActiveElementId);
                console.log("navigation remote key pressed while recordedShowsPage visible");
                navigateRecordedShowsPage(command)
                return "HANDLED";
            case "exit":
                stateData.nextState = this.stateMachine.stNone;
                return "TRANSITION";
            case "select":
                var currentElement = document.activeElement;
                var currentElementId = currentElement.id;
                console.log("active recorded shows page item is " + currentElementId);

                var action = this.getAction(currentElementId);
                if (action != "") {
                    var recordingId = currentElementId.substring(action.length);
                    switch (action) {
                        case "recording":
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
    ['recordedShows', 'setManualRecord'],
    ['channelGuide', 'userSelection'],
    ['toDoList', 'myPlayVideo']
];

function navigateHomePage(navigationCommand$) {

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

    console.log("currentElementId is " + currentElementId);

    var newElementId = "#" + mainMenuIds[rowIndex][colIndex];

    $("#" + currentElementId).removeClass("btn-primary");
    $("#" + currentElementId).addClass("btn-secondary");

    $(newElementId).removeClass("btn-secondary");
    $(newElementId).addClass("btn-primary");

    $(newElementId).focus();
}


function navigateRecordedShowsPage(navigationCommand$) {

    console.log("navigateRecordedShowsPage entry");

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

