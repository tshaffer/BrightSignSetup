var clientType;
var browserTypeIsSafari;

var baseURL;
var baseIP;

var _currentRecordings = {};

var currentActiveElementId = "#homePage";

var recordedPageIds = [];

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function switchToPage(newPage) {

    var newPageId = "#" + newPage;
    $(currentActiveElementId).css("display", "none");
    currentActiveElementId = newPageId;
    $(currentActiveElementId).removeAttr("style");
    if (currentActiveElementId == "#homePage") {
        setFooterVisibility(true, false)
        $("#trickModeKeys").css("display", "block");

        // ensure that the first element is highlighted and has focus
        // TODO - make this more general purpose?
        for (i = 0; i < mainMenuIds.length; i++) {
            for (j = 0; j < mainMenuIds[i].length; j++) {
                var elementId = "#" + mainMenuIds[i][j];

                if (i != 0 || j != 0) {
                    $(elementId).removeClass("btn-primary");
                    $(elementId).addClass("btn-secondary");
                }
                else {
                    $(elementId).removeClass("btn-secondary");
                    $(elementId).addClass("btn-primary");
                    $(elementId).focus();
                }
            }
        }

    } else {
        setFooterVisibility(true, true)
        $("#ipAddress").css("display", "none");
    }
}


function selectHomePage() {
    switchToPage("homePage");
}


function selectRecordedShows() {
    switchToPage("recordedShowsPage");
    getRecordedShows();
}


function getRecordedShows() {

    console.log("getRecordedShows() invoked");

    var aUrl = baseURL + "getRecordings";

    $.ajax({
        type: "GET",
        url: aUrl,
        dataType: "json",
        success: function (recordings) {

            // convert freespace from disk space to time (approximation) and display it
            var freeSpace = recordings.freespace;
            // 44934K per minute - sample 1 - long recording
            // 43408K per minute - sample 2 - 11 minute recording
            // use 44Mb per minute
            var freeSpaceInMegabytes = Number(freeSpace);
            var freeSpaceInMinutes = Math.floor(freeSpaceInMegabytes / 44);
            var freeSpaceInHours = Math.floor(freeSpaceInMinutes / 60);

            var freeSpace = "Free space: ";
            if (freeSpaceInHours > 0) {
                if (freeSpaceInHours > 1) {
                    freeSpace += freeSpaceInHours.toString() + " hours";
                }
                else {
                    freeSpace += "1 hour";
                }
                var partialFreeSpaceInMinutes = freeSpaceInMinutes % (freeSpaceInHours * 60);
                if (partialFreeSpaceInMinutes > 0) {
                    freeSpace += ", " + partialFreeSpaceInMinutes.toString() + " minutes";
                }
            }
            else {
                freeSpace += freeSpaceInMinutes.toString() + " minutes";
            }
            $("#recordedShowsRemainingSpace").text(freeSpace);

            // display show recordings
            var jtrRecordings = recordings.recordings;

            var toAppend = "";
            var recordingIds = [];

            $("#recordedShowsTableBody").empty();

            _currentRecordings = {};

            $.each(jtrRecordings, function (index, jtrRecording) {
                toAppend += addRecordedShowsLine(jtrRecording);
                recordingIds.push(jtrRecording.RecordingId);
                _currentRecordings[jtrRecording.RecordingId] = jtrRecording;
            });

            // is there a reason to do this all at the end instead of once for each row?
            $("#recordedShowsTableBody").append(toAppend);

            recordedPageIds.length = 0;

            // get last selected show from local storage - navigate to it. null if not defined
            var url = baseURL + "lastSelectedShow";

            $.get(url, {})
                .done(function (result) {
                    console.log("lastSelectedShow successfully sent");
                    var lastSelectedShowId = result;

                    var focusApplied = false;

                    // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                    $.each(jtrRecordings, function (index, recording) {
                        
                        var recordingId = recording.RecordingId;

                        // play a recording
                        var btnIdRecording = "#recording" + recordingId;
                        $(btnIdRecording).click({ recordingId: recordingId }, playSelectedShow);

                        // delete a recording
                        var btnIdDelete = "#delete" + recordingId;
                        $(btnIdDelete).click({ recordingId: recordingId }, deleteSelectedShow);

                        // play from beginning
                        var btnIdPlayFromBeginning = "#repeat" + recordingId;
                        $(btnIdPlayFromBeginning).click({ recordingId: recordingId }, playSelectedShowFromBeginning);

                        // stream a recording
                        var btnIdStream = "#stream" + recordingId;
                        $(btnIdStream).click({ recordingId: recordingId, hlsUrl: recording.HLSUrl }, streamSelectedShow);

                        // highlight the last selected show
                        if (recordingId == lastSelectedShowId) {
                            focusApplied = true;
                            $(btnIdRecording).focus();
                        }

                        var recordedPageRow = [];
                        recordedPageRow.push(btnIdRecording);
                        recordedPageRow.push(btnIdDelete);
                        recordedPageIds.push(recordedPageRow);

                    });

                    if (!focusApplied) {
                        $(recordedPageIds[0][0]).focus();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("lastSelectedShow failure");
                })
                .always(function () {
                    //alert("lastSelectedShow finished");
                });
        }
    });
}


function addRecordedShowsLine(jtrRecording) {

    /*
        Play icon
        Delete icon
        Title
        Date
        Day of week
        Info icon
        Position
    */

    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    var dt = jtrRecording.StartDateTime;
    var n = dt.indexOf(".");
    var formattedDayDate;
    if (n >= 0) {
        var dtCompatible = dt.substring(0, n);
        var date = new Date(dtCompatible);
        formattedDayDate = weekday[date.getDay()] + " " + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
    }
    else {
        formattedDayDate = "poop";
    }

    var lastViewedPositionInMinutes = Math.floor(jtrRecording.LastViewedPosition / 60);
    var position = lastViewedPositionInMinutes.toString() + " of " + jtrRecording.Duration.toString() + " minutes";

    var toAppend =
        "<tr>" +
        "<td><button type='button' class='btn btn-default recorded-shows-icon' id='recording" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-play' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='delete" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='repeat" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-repeat' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon streamIcon' id='stream" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-cloud-download' aria-hidden='true'></span></button></td>" +
        "<td>" + jtrRecording.Title + "</td>" +
        "<td>" + formattedDayDate + "</td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='info" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button></td>" +
        "<td>" + position + "</td>";

    return toAppend;
}


function selectChannelGuide() {

}


function selectToDoList() {
    switchToPage("toDoListPage");
    getToDoList();
}


function getToDoList() {
    var aUrl = baseURL + "toDoList";

    $.ajax({
        type: "GET",
        url: aUrl
    })
    .done(function (result) {
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr id=\"toDoListRow" + i + " \"><td>date to record</td><td>title</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
    });
}


function selectLiveVideo() {

}


function selectRecordNow() {
    switchToPage("recordNowPage");
    setDefaultDateTimeFields();
    $("#recordNowTitle").focus();
}


function selectManualRecord() {
    switchToPage("manualRecordPage");
    setDefaultDateTimeFields();
    $("#manualRecordTitle").focus();
}


function twoDigitFormat(val) {
    val = '' + val;
    if (val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}


function setDefaultDateTimeFields() {
    var date = new Date();

    var toAppendDate = "<input id=\"manualRecordDate\"  type=\"date\" class=\"form-control\" value=\"" + date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate()) + "\">";
    var toAppendTime = "<input id=\"manualRecordTime\" type=\"time\" class=\"form-control\" value=\"" + twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes()) + "\">";

    if ($("#manualRecordDate").length) {
        $("#manualRecordDate").remove();
        $("#manualRecordTime").remove();
    }

    $("#manualRecordDateId").append(toAppendDate);
    $("#manualRecordTimeId").append(toAppendTime);
}

function getRecordingTitle(titleId, dateObj, useTuner, channel) {

    var title = $(titleId).val();
    if (!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if (useTuner) {
            title += " Channel " + channel;
        } else {
            title += " HDMI-In";
        }
    }

    return title;
}

function recordedShowDetails(showId) {
    // body...
    switchToPage("recordedShowDetailsPage");
    var showTitle = getShowTitle(showId);
    var showDescription = getShowDescription(showId);

    var toAppend = "<h3>" + showTitle + "</h3><br><br>"
        + "<p>" + showDescription + "</p><br><br>"
        + "<button>Play</button><br><br>"
        + "<button>Delete</button>";

    $("#recordedShowDetailsPage").append(toAppend);
}

function getShowTitle(showId) {
    // body...
}

function getShowDescription(showId) {
    // body...
}

function eraseUI() {
    $("#ipAddress").css("display", "none");
    $(currentActiveElementId).css("display", "none");
    $("#footerArea").css("display", "none");
}

function setFooterVisibility(trickModeKeysVisibility, homeButtonVisibility) {

    if (homeButtonVisibility) {
        $("#homeButton").html("<button class='btn btn-primary' onclick='selectHomePage()'>Home</button><br><br>");
    }
    else {
        $("#homeButton").text("");
    }

    if (trickModeKeysVisibility) {
        $("#trickModeKeys").removeClass("clearDisplay");
        $("#trickModeKeys").addClass("inlineDisplay");
    }
    else {
        $("#trickModeKeys").removeClass("inlineDisplay");
        $("#trickModeKeys").addClass("clearDisplay");
    }
}

$(document).ready(function () {

    var recordingDuration;
    var recordingTitle;

    console.log("JTR javascript .ready invoked");
    console.log("User Agent: " + navigator.userAgent);

    // get client from user agent
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("BrightSign") >= 0) {
        clientType = "BrightSign"
    }
    else if (userAgent.indexOf("iPad")) {
        clientType = "iPad"
    }

    if (userAgent.indexOf("Mac") >= 0 && userAgent.indexOf("Chrome") < 0) {
        browserTypeIsSafari = true;
    }
    else {
        browserTypeIsSafari = false;
    }

    if (clientType != "BrightSign") {
        baseURL = document.baseURI.replace("?", "");
        baseIP = document.baseURI.substr(0, document.baseURI.lastIndexOf(":"));

        console.log("baseURL from document.baseURI is: " + baseURL + ", baseIP is: " + baseIP);
    }
    else {
        initializeBrightSign();
    }
});