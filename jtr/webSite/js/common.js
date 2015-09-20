var clientType;
var browserTypeIsSafari;

var baseURL;
var baseIP;

var _settingsRetrieved = false;
var _settings = {};
_settings.recordingBitRate = 10;
_settings.segmentRecordings = 0;

var _currentRecordings = {};

var currentActiveElementId = "#homePage";

var recordedPageIds = [];
var scheduledRecordingIds = [];

var cgPopupId = "";
var cgPopupTitle = "";
var cgPopupElements;
var cgPopupHandlers;

var cgRecordEpisodeId;
var cgRecordSeriesId;
var cgTuneEpisodeId;
var cgCloseEpisodeId;

var cgRecordSetOptionsId;
var cgRecordViewUpcomingEpisodesId;
var cgCancelRecordingId;
var cgCancelSeriesId;

var cgSelectedStationId;
var cgSelectedProgram;
var cgPopupSelectedIndex;

var cgPopupEpisodeElements = ["#cgProgramRecord", "#cgProgramRecordSetOptions", "#cgProgramViewUpcomingEpisodes", "#cgProgramTune", "#cgProgramClose"];
var cgPopupEpisodeHandlers = [cgRecordSelectedProgram, cgRecordProgramSetOptions, cgRecordProgramViewUpcomingEpisodes, cgTune, cgModalClose];

var cgPopupScheduledProgramElement = ["#cgCancelScheduledRecording", "#cgScheduledRecordChangeOptions", "#cgScheduledRecordingViewUpcomingEpisodes", "#cgScheduledRecordingTune", "#cgScheduledRecordingClose"];
var cgPopupScheduledProgramHandlers = [cgCancelScheduledRecording, cgChangeScheduledRecordingOptions, cgScheduledRecordingViewUpcomingEpisodes, cgScheduledRecordingTune, cgScheduledRecordingClose];

var cgPopupSeriesElements = ["#cgEpisodeRecord", "cgSeriesRecordSetProgramOptions", "#cgSeriesRecord", "#cgSeriesTune", "#cgSeriesClose"];
var cgPopupSeriesHandlers = [cgRecordSelectedProgram, cgRecordProgramSetOptions, cgRecordSelectedSeries, cgTune, cgModalClose];

var cgPopupScheduledSeriesElements = ["cgSeriesCancelEpisode", "cgSeriesCancelSeries", "cgSeriesViewUpcoming", "cgSeriesRecordingTune", "cgSeriesRecordingClose"];
var cgPopupSchedulesSeriesHandlers = [cgCancelScheduledRecording, cgCancelScheduledSeries, cgScheduledSeriesViewUpcoming, cgTune, cgModalClose];

var stopTimeOptions = ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"];
var stopTimeOffsets = [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180];

var stopTimeOnTimeIndex = 4;
var stopTimeIndex;

var startTimeOptions = ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"];
var startTimeOnTimeIndex = 3;
var startTimeOffsets = [-15, -10, -5, 0, 5, 10, 15];
var startTimeIndex;

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function addMilliseconds(date, milliseconds) {
    return new Date(date.getTime() + milliseconds);
}

function msecToMinutes(msec) {
    return msec / 60000;
}

function minutesToMsec(minutes) {
    return minutes * 60000;
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
        Play From Beginning icon
        Stream icon
        Download icon
        Title
        Date
        Day of week ??
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
	    "<td><button type='button' class='btn btn-default recorded-shows-icon streamIcon' id='stream" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-random' aria-hidden='true'></span></button></td>" +
        "<td><a class='downloadIcon' id='download' href='" + jtrRecording.path + "' download='" + jtrRecording.Title + "'><span class='glyphicon glyphicon-cloud-download' aria-hidden='true'></span></a></td>" +
        "<td>" + jtrRecording.Title + "</td>" +
        "<td>" + formattedDayDate + "</td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='info" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button></td>" +
        "<td>" + position + "</td>" +
        "</tr>";

    return toAppend;
}


function retrieveSettings(nextFunction) {

    // get settings from db
    var url = baseURL + "getSettings";
    $.get(url, {})
        .done(function (result) {
            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX retrieveSettings success ************************************");
            _settingsRetrieved = true;
            _settings.recordingBitRate = result.RecordingBitRate;
            _settings.segmentRecordings = result.SegmentRecordings;
            nextFunction();
        })
    .fail(function (jqXHR, textStatus, errorThrown) {
        debugger;
        console.log("getSettings failure");
    })
    .always(function () {
    });
}

function selectSettings() {

    switchToPage("settingsPage");

    consoleLog("selectSettings invoked");

    retrieveSettings(initializeSettingsUIElements);

    $(".recordingQuality").change(function () {
        _settings.recordingBitRate = $('input:radio[name=recordingQuality]:checked').val();
        updateSettings();
    });

    $("#segmentRecordingsCheckBox").change(function () {
        var segmentRecordings = $("#segmentRecordingsCheckBox").is(':checked');
        _settings.segmentRecordings = segmentRecordings ? 1 : 0;
        updateSettings();
    });
}


function initializeSettingsUIElements() {

    // initialize UI on settings page
    // TODO - don't hard code these values; read through html
    switch (_settings.recordingBitRate) {
        case 4:
            $("#recordingQualityLow").prop('checked', true);
            break;
        case 6:
            $("#recordingQualityMedium").prop('checked', true);
            break;
        case 10:
            $("#recordingQualityHigh").prop('checked', true);
            break;
    }

    switch (_settings.segmentRecordings) {
        case 0:
            $("#segmentRecordingsCheckBox").prop('checked', false);
            break;
        case 1:
            $("#segmentRecordingsCheckBox").prop('checked', true);
            break;
    }
}

function updateSettings() {
    var url = baseURL + "setSettings";
    var settingsData = { "recordingBitRate": _settings.recordingBitRate, "segmentRecordings": _settings.segmentRecordings };
    $.get(url, settingsData)
        .done(function (result) {
            console.log("setSettings success");
        })
    .fail(function (jqXHR, textStatus, errorThrown) {
        debugger;
        console.log("setSettings failure");
    })
    .always(function () {
    });
}



function selectToDoList() {
    switchToPage("toDoListPage");
    getToDoList();
}


function getToDoList() {

    console.log("getToDoList() invoked");

    var getStationsPromise = new Promise(function (resolve, reject) {

        var aUrl = baseURL + "getStations";

        $.get(
            aUrl
        ).then(function (stations) {
                resolve(stations);
            }, function () {
                reject();
            });
    });

    getStationsPromise.then(function(stations) {

        var aUrl = baseURL + "getScheduledRecordings";
        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = { "currentDateTime": currentDateTimeIso };

        $.get(aUrl, currentDateTime)
            .done(function (scheduledRecordings) {
                console.log("getScheduledRecordings success");

                // display scheduled recordings
                var toAppend = "";

                $("#scheduledRecordingsTableBody").empty();

                $.each(scheduledRecordings, function (index, scheduledRecording) {
                    toAppend += addScheduledRecordingShowLine(scheduledRecording, stations);
                });

                $("#scheduledRecordingsTableBody").append(toAppend);

                scheduledRecordingIds.length = 0;

                // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                $.each(scheduledRecordings, function (index, scheduledRecording) {

                    var scheduledRecordingId = scheduledRecording.Id;

                    // only one of the next two handlers can be invoked - that is, either btnIdStop or btnIdDelete exists

                    // stop an active recording
                    var btnIdStop = "#stop" + scheduledRecordingId;
                    $(btnIdStop).click({ scheduledRecordingId: scheduledRecordingId }, stopActiveRecording);

                    // delete a scheduled recording
                    var btnIdDelete = "#delete" + scheduledRecordingId;
                    $(btnIdDelete).click({ scheduledRecordingId: scheduledRecordingId }, deleteScheduledRecordingHandler);

                    var scheduledRecordingRow = [];
                    scheduledRecordingRow.push(btnIdDelete);
                    scheduledRecordingIds.push(scheduledRecordingRow);
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                debugger;
                console.log("browserCommand failure");
            })
            .always(function () {
                //alert("recording transmission finished");
            });
    });
}

function addScheduledRecordingShowLine(scheduledRecording, stations) {

    /*
    Delete / Stop icon
    DayOfWeek
    Date
    Time
    Channel
    Station Name
    Title
     */

    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    var currentDateTime = new Date();
    var date = new Date(scheduledRecording.DateTime);
    var endDateTime = new Date(scheduledRecording.EndDateTime);

    var clickAction = "delete";
    var icon = 'glyphicon-remove';
    if (date <= currentDateTime && currentDateTime < endDateTime) {
        clickAction = "stop";
        icon = 'glyphicon-stop';
    }

    var dayOfWeek = weekday[date.getDay()];

    var monthDay = (date.getMonth() + 1).toString() + "/" + date.getDate().toString();

    var amPM = "am";

    var numHours = date.getHours();
    if (numHours == 0)
    {
        numHours = 12;
    }
    else if (numHours > 12) {
        numHours -= 12;
        amPM = "pm";
    }
    else if (numHours == 12) {
        amPM = "pm";
    }
    var hoursLbl = numHours.toString();
    if (hoursLbl.length == 1) hoursLbl = "&nbsp" + hoursLbl;

    var minutesLbl = twoDigitFormat(date.getMinutes().toString());

    var timeOfDay = hoursLbl + ":" + minutesLbl + amPM;

    var channel = scheduledRecording.Channel;
    var channelParts = channel.split('-');
    if (channelParts.length == 2 && channelParts[1] == "1") {
        channel = channelParts[0];
    }

    var station = getStationFromAtsc(stations, channelParts[0], channelParts[1]);

    var stationName = "TBD";
    if (station != null) {
        stationName = station.CommonName;
    }

    var title = scheduledRecording.Title;

    var toAppend =
        "<tr>" +
        "<td><button type='button' class='btn btn-default recorded-shows-icon' id='" + clickAction + scheduledRecording.Id.toString() + "' aria-label='Left Align'><span class='glyphicon " + icon + "' aria-hidden='true'></span></button></td>" +
        "<td>" + dayOfWeek + "</td>" +
        "<td>" + monthDay + "</td>" +
        "<td>" + timeOfDay + "</td>" +
        "<td>" + channel + "</td>" +
        "<td>" + stationName + "</td>" +
        "<td>" + title + "</td>" +
        "</tr>";

    return toAppend;
}



function selectLiveVideo() {

}


function setElementVisibility(divId, show) {
    if (show) {
        $(divId).show();
    }
    else {
        $(divId).hide();
    }
}


function selectRecordNow() {
    switchToPage("recordNowPage");

    $("#rbRecordNowTuner").change(function () {
        setElementVisibility("#recordNowChannelDiv", true);
    });

    $("#rbRecordNowRoku").change(function () {
        setElementVisibility("#recordNowChannelDiv", false);
    });

    $("#rbRecordNowTivo").change(function () {
        setElementVisibility("#recordNowChannelDiv", false);
    });

    setDefaultDateTimeFields();
    $("#recordNowTitle").focus();
}


function selectManualRecord() {

    switchToPage("manualRecordPage");

    $("#rbManualRecordTuner").change(function () {
        setElementVisibility("#manualRecordChannelDiv", true);
    });

    $("#rbManualRecordRoku").change(function () {
        setElementVisibility("#manualRecordChannelDiv", false);
    });

    $("#rbManualRecordTivo").change(function () {
        setElementVisibility("#manualRecordChannelDiv", false);
    });

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

    var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
    $("#manualRecordDate").val(dateVal);

    var timeVal = twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
    $("#manualRecordTime").val(timeVal);
}

function getRecordingTitle(titleId, dateObj, inputSource, channel) {

    var title = $(titleId).val();
    if (!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if (inputSource == "tuner") {
            title += " Channel " + channel;
        } else if (inputSource == "tivo") {
            title += " Tivo";
        } else {
            title += " Roku";
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


function cgTune() {

    // enter live video
    var event = {};
    event["EventType"] = "TUNE_LIVE_VIDEO";
    postMessage(event);

    // tune to selected channel
    var stationName = getStationFromId(cgSelectedStationId);
    stationName = stationName.replace(".", "-");
    event["EventType"] = "TUNE_LIVE_VIDEO_CHANNEL";
    event["EnteredChannel"] = stationName;
    postMessage(event);

    return "tune";
}


function cgTuneFromClient() {

    var stationName = getStationFromId(cgSelectedStationId);
    stationName = stationName.replace(".", "-");

    var aUrl = baseURL + "browserCommand";
    var commandData = { "command": "tuneLiveVideoChannel", "enteredChannel": stationName };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


function updateCGProgramDlgSelection() {

    for (i = 0; i < cgPopupElements.length; i++) {
        $(cgPopupElements[i]).removeClass("btn-primary");
        $(cgPopupElements[i]).addClass("btn-secondary");
    }

    $(cgPopupElements[cgPopupSelectedIndex]).removeClass("btn-secondary");
    $(cgPopupElements[cgPopupSelectedIndex]).addClass("btn-primary");
}

// EXTENDOMATIC TODO - do the work associated with extendomatic here
function cgRecordProgram() {
    // redundant in some cases (when selected from pop up); not when record button pressed
    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    cgSelectedStationId = programData.stationId;

    var event = {};
    event["EventType"] = "ADD_RECORD";
    event["DateTime"] = cgSelectedProgram.date;
    event["Title"] = cgSelectedProgram.title;
    event["Duration"] = cgSelectedProgram.duration;
    event["InputSource"] = "tuner";
    event["ScheduledSeriesRecordingId"] = cgSelectedProgram.scheduledSeriesRecordingId;
    event["StartTimeOffset"] = 0;
    event["StopTimeOffset"] = 0;

    var stationName = getStationFromId(cgSelectedStationId);

    stationName = stationName.replace(".", "-");

    event["Channel"] = stationName;

    event["RecordingBitRate"] = _settings.recordingBitRate;
    event["SegmentRecording"] = _settings.segmentRecordings;

    postMessage(event);

    return "record";
}


function cgRecordSelectedProgram() {

    // setting cgSelectedProgram and cgSelectedStationId is redundant in some cases (when selected from pop up); not when record button pressed
    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    cgSelectedStationId = programData.stationId;

    cgRecordProgram();
}

function cgRecordProgramFromClient(addRecording, nextFunction) {

    console.log("cgRecordProgramFromClient invoked");

    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    cgSelectedStationId = programData.stationId;

    cgSelectedProgram.startTimeOffset = startTimeOffsets[startTimeIndex];
    cgSelectedProgram.stopTimeOffset = stopTimeOffsets[stopTimeIndex];

    var aUrl = baseURL + "browserCommand";

    if (addRecording) {
        var stationName = getStationFromId(cgSelectedStationId);
        stationName = stationName.replace(".", "-");

        var commandData = { "command": "addRecord", "dateTime": cgSelectedProgram.date, "title": cgSelectedProgram.title, "duration": cgSelectedProgram.duration,
            "inputSource": "tuner", "channel": stationName, "recordingBitRate": _settings.recordingBitRate, "segmentRecording": _settings.segmentRecordings,
            "scheduledSeriesRecordingId": cgSelectedProgram.scheduledSeriesRecordingId,
            "startTimeOffset": cgSelectedProgram.startTimeOffset, "stopTimeOffset": cgSelectedProgram.stopTimeOffset };
    }
    else {
        var commandData = { "command": "updateScheduledRecording", "id": cgSelectedProgram.scheduledRecordingId,
            "startTimeOffset": cgSelectedProgram.startTimeOffset, "stopTimeOffset": cgSelectedProgram.stopTimeOffset };
    }

    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("cgRecordProgramFromClient: add or update record processing complete");
            if (nextFunction != null) {
                nextFunction();
            }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


function cgRecordSelectedSeriesFromClient(nextFunction) {

    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    cgSelectedStationId = programData.stationId;

    var stationName = getStationFromId(cgSelectedStationId);
    stationName = stationName.replace(".", "-");

    var aUrl = baseURL + "browserCommand";
    var commandData = { "command": "addSeries", "title": cgSelectedProgram.title,
        "inputSource": "tuner", "channel": stationName, "recordingBitRate": _settings.recordingBitRate, "segmentRecording": _settings.segmentRecordings };
    console.log(commandData);

    $.get(aUrl, commandData)
        .done(function (result) {
            console.log("browserCommand addSeries successfully sent");
            if (nextFunction != null) {
                nextFunction();
            }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("browserCommand failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });

    //return cgRecordProgramFromClient();
}

function cgRecordSelectedSeries() {
    return cgRecordProgram();
}



// new handlers
function cgCancelScheduledRecording() {
    console.log("cgCancelScheduledRecording invoked");
}

function cgCancelScheduledSeries() {
    console.log("cgCancelScheduledSeries invoked");
}


function cgScheduledSeriesViewUpcoming() {
    console.log("cgScheduledSeriesViewUpcoming invoked");
}

function cgCancelScheduledRecordingFromClient(nextFunction) {
    console.log("cgCancelScheduledRecordingFromClient invoked");
    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    deleteScheduledRecording(cgSelectedProgram.scheduledRecordingId, nextFunction);
}


function cgCancelScheduledSeriesFromClient(nextFunction) {
    console.log("cgCancelScheduledSeriesFromClient invoked");
    var programData = ChannelGuideSingleton.getInstance().getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    deleteScheduledSeries(cgSelectedProgram.scheduledSeriesRecordingId, nextFunction);
}

function cgRecordProgramSetOptions() {
    console.log("cgRecordProgramSetOptions invoked");

    // erase existing dialog, show new one
    cgProgramDlgCloseInvoked();

    // use common code in displayCGPopUp??
    var options = {
        "backdrop": "true"
    }
    $("#cgRecordingOptionsDlg").modal(options);
    $("#cgRecordingOptionsTitle").html(cgSelectedProgram.title);

    // for a program that has not been setup to record, cgSelectedProgram.startTimeOffset = 0, etc.
    stopTimeIndex = stopTimeOnTimeIndex;
    startTimeIndex = startTimeOnTimeIndex;

    $.each(startTimeOffsets, function (index, startTimeOffset) {
        if (startTimeOffset == cgSelectedProgram.startTimeOffset) {
            startTimeIndex = index;
            return false;
        }
    });

    $.each(stopTimeOffsets, function (index, stopTimeOffset) {
        if (stopTimeOffset == cgSelectedProgram.stopTimeOffset) {
            stopTimeIndex = index;
            return false;
        }
    });

    displayStartTimeSetting();
    displayStopTimeSetting();

    // highlight first button; unhighlight other buttons
    $("#cgRecordOptionsStopTime").removeClass("btn-secondary");
    $("#cgRecordOptionsStopTime").addClass("btn-primary");
    $("#cgRecordOptionsStartTime").removeClass("btn-primary");
    $("#cgRecordOptionsStartTime").addClass("btn-secondary");
    $("#cgRecordOptionsSave").removeClass("btn-primary");
    $("#cgRecordOptionsSave").addClass("btn-secondary");
    $("#cgRecordOptionsCancel").removeClass("btn-primary");
    $("#cgRecordOptionsCancel").addClass("btn-secondary");


    var addRecordToDB = true;
    if (cgSelectedProgram.scheduledRecordingId > 0) {
        addRecordToDB = false;
    }
    $("#cgRecordOptionsSave").click(function (event) {
        $("#cgRecordOptionsSave").unbind("click");
        $("#cgRecordingOptionsDlg").modal('hide');
        cgRecordProgramFromClient(addRecordToDB, ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
        ChannelGuideSingleton.getInstance().reselectCurrentProgram();
    });

    $("#cgRecordOptionsCancel").click(function (event) {
        $("#cgRecordingOptionsDlg").modal('hide');
        ChannelGuideSingleton.getInstance().reselectCurrentProgram();
    });
}

function cgRecordOptionsNextEarlyStopTime() {
    console.log("cgRecordOptionsNextEarlyStopTime invoked");

    if (stopTimeIndex > 0) {
        stopTimeIndex--;
        displayStopTimeSetting();
    }
}

function displayStopTimeSetting() {
    $("#cgRecordOptionsStopTimeLabel")[0].innerHTML = stopTimeOptions[stopTimeIndex];
}

function cgRecordOptionsNextLateStopTime() {
    console.log("cgRecordOptionsNextLateStopTime invoked");

    if (stopTimeIndex < (stopTimeOptions.length-1)) {
        stopTimeIndex++;
        displayStopTimeSetting();
    }
}

function cgRecordOptionsNextEarlyStartTime() {
    console.log("cgRecordOptionsNextEarlyStartTime invoked");

    if (startTimeIndex > 0) {
        startTimeIndex--;
        displayStartTimeSetting();
    }
}

function displayStartTimeSetting() {
    $("#cgRecordOptionsStartTimeLabel")[0].innerHTML = startTimeOptions[startTimeIndex];
}

function cgRecordOptionsNextLateStartTime() {
    console.log("cgRecordOptionsNextLateStartTime invoked");

    if (startTimeIndex < (startTimeOptions.length-1)) {
        startTimeIndex++;
        displayStartTimeSetting();
    }
}

function cgRecordProgramViewUpcomingEpisodes() {
    console.log("cgRecordProgramViewUpcomingEpisodes invoked");
}

function cgChangeScheduledRecordingOptions() {
    console.log("cgChangeScheduledRecordingOptions invoked");
}

function cgScheduledRecordingViewUpcomingEpisodes() {
    console.log("cgScheduledRecordingViewUpcomingEpisodes invoked");
}

function cgScheduledRecordingTune() {
    console.log("cgScheduledRecordingTune invoked");
}

function cgScheduledRecordingClose() {
    console.log("cgScheduledRecordingClose invoked");
}

function displayCGPopUp() {

    consoleLog("displayCGPopUp() invoked");

    var channelGuide = ChannelGuideSingleton.getInstance();

    var programData = channelGuide.getSelectedStationAndProgram();
    cgSelectedProgram = programData.program;
    cgSelectedStationId = programData.stationId;

    stopTimeIndex = stopTimeOnTimeIndex;
    startTimeIndex = startTimeOnTimeIndex;

    // check the program that the user has clicked
    // display different pop ups based on
    //      single vs. series
    //      already scheduled to record or not
    var cgSelectedProgramScheduledToRecord = false;
    cgSelectedProgram.scheduledRecordingId = -1;
    cgSelectedProgram.scheduledSeriesRecordingId = -1;
    cgSelectedProgram.startTimeOffset = 0;
    cgSelectedProgram.stopTimeOffset = 0;
    if (channelGuide.scheduledRecordings != null) {
        $.each(channelGuide.scheduledRecordings, function (index, scheduledRecording) {
            cgSelectedProgramScheduledToRecord = programsMatch(scheduledRecording, cgSelectedProgram, cgSelectedStationId);
            if (cgSelectedProgramScheduledToRecord) {
                cgSelectedProgram.scheduledRecordingId = scheduledRecording.Id;
                cgSelectedProgram.scheduledSeriesRecordingId = scheduledRecording.ScheduledSeriesRecordingId;
                cgSelectedProgram.startTimeOffset = scheduledRecording.StartTimeOffset;
                cgSelectedProgram.stopTimeOffset = scheduledRecording.StopTimeOffset;
                return false;
            }
        });
        console.log("cgSelectedProgramScheduledToRecord=" + cgSelectedProgramScheduledToRecord.toString());
    }

    cgRecordEpisodeId = null;
    cgRecordSeriesId = null;
    cgCancelRecordingId = null;
    cgCancelSeriesId = null;
    cgRecordSetOptionsId = null;
    cgRecordViewUpcomingEpisodesId = null;
    cgTuneEpisodeId = null;

    // JTRTODO - optimize the logic here - I think I can make it simpler
    if (cgSelectedProgram.showType == "Series") {
        if (cgSelectedProgram.scheduledRecordingId == -1) {
            // not yet scheduled to record
            cgPopupId = '#cgSeriesDlg';
            cgPopupTitle = '#cgSeriesDlgShowTitle';
            cgPopupElements = cgPopupSeriesElements;
            cgPopupHandlers = cgPopupSeriesHandlers;

            cgRecordEpisodeId = "#cgEpisodeRecord";
            cgRecordSetOptionsId = "#cgSeriesRecordSetProgramOptions";
            cgRecordSeriesId = "#cgSeriesRecord";
            cgTuneEpisodeId = "#cgSeriesTune";
            cgCloseEpisodeId = "#cgSeriesClose";
        }
        else {
            // previously scheduled to record
            if (cgSelectedProgram.scheduledSeriesRecordingId > 0) {
                cgPopupId = '#cgScheduledSeriesDlg';
                cgPopupTitle = '#cgScheduledSeriesDlgTitle';
                cgPopupElements = cgPopupScheduledSeriesElements;
                cgPopupHandlers = cgPopupSchedulesSeriesHandlers;

                cgCancelRecordingId = "#cgSeriesCancelEpisode";
                cgCancelSeriesId = "#cgSeriesCancelSeries";
                cgRecordViewUpcomingEpisodesId = "#cgSeriesViewUpcoming";
                cgTuneEpisodeId = "#cgSeriesRecordingTune";
                cgCloseEpisodeId = "#cgSeriesRecordingClose";
            }
            else {
                cgPopupId = '#cgScheduledRecordingDlg';
                cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                cgPopupElements = cgPopupScheduledProgramElement;
                cgPopupHandlers = cgPopupScheduledProgramHandlers;

                cgCancelRecordingId = "#cgCancelScheduledRecording";
                cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
                cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
                cgTuneEpisodeId = "#cgScheduledRecordingTune";
                cgCloseEpisodeId = "#cgScheduledRecordingClose";
            }
        }
    }
    else        // single program recordings (not series)
    {
        if (cgSelectedProgram.scheduledRecordingId == -1) {         // no recording set
            cgPopupId = '#cgProgramDlg';
            cgPopupTitle = '#cgProgramDlgShowTitle';
            cgPopupElements = cgPopupEpisodeElements;
            cgPopupHandlers = cgPopupEpisodeHandlers;

            cgRecordEpisodeId = "#cgProgramRecord";
            cgRecordSetOptionsId = "#cgProgramRecordSetOptions";
            cgRecordViewUpcomingEpisodesId = "#cgProgramViewUpcomingEpisodes";
            cgTuneEpisodeId = "#cgProgramTune";
            cgCloseEpisodeId = "#cgProgramClose";
        }
    else {                                                          // recording already setup
            cgPopupId = '#cgScheduledRecordingDlg';
            cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
            cgPopupElements = cgPopupScheduledProgramElement;
            cgPopupHandlers = cgPopupScheduledProgramHandlers;

            cgCancelRecordingId = "#cgCancelScheduledRecording";
            cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
            cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
            cgTuneEpisodeId = "#cgScheduledRecordingTune";
            cgCloseEpisodeId = "#cgScheduledRecordingClose";
        }
    }

    // setup handlers for browser
    if (cgRecordEpisodeId) {
        $(cgRecordEpisodeId).off();
        $(cgRecordEpisodeId).click(function (event) {
            $(cgRecordEpisodeId).unbind("click");
            cgRecordProgramFromClient(true, ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
    });
}
    if (cgRecordSeriesId) {
        $(cgRecordSeriesId).off();
        $(cgRecordSeriesId).click(function (event) {
            cgRecordSelectedSeriesFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgTuneEpisodeId){
        $(cgTuneEpisodeId).off();
        $(cgTuneEpisodeId).click(function (event) {
            cgTuneFromClient();
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgCancelRecordingId) {
        $(cgCancelRecordingId).off();
        $(cgCancelRecordingId).click(function (event) {
            console.log("CancelRecording invoked");
            cgCancelScheduledRecordingFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgCancelSeriesId) {
        $(cgCancelSeriesId).off();
        $(cgCancelSeriesId).click(function (event) {
            console.log("CancelSeriesRecording invoked");
            cgCancelScheduledSeriesFromClient(ChannelGuideSingleton.getInstance().retrieveScheduledRecordings);
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgRecordSetOptionsId) {
        $(cgRecordSetOptionsId).off();
        $(cgRecordSetOptionsId).click(function (event) {
            console.log("recordSetOptions invoked");
            cgRecordProgramSetOptions();
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgRecordViewUpcomingEpisodesId) {
        $(cgRecordViewUpcomingEpisodesId).off();
        $(cgRecordViewUpcomingEpisodesId).click(function (event) {
            console.log("ViewUpcomingEpisodes invoked")
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }

    if (cgCloseEpisodeId) {
        $(cgCloseEpisodeId).off();
        $(cgCloseEpisodeId).click(function (event) {
            cgProgramDlgCloseInvoked();
            ChannelGuideSingleton.getInstance().reselectCurrentProgram();
        });
    }


    cgPopupSelectedIndex = 0;

    var options = {
        "backdrop": "true"
    }
    $(cgPopupId).modal(options);
    $(cgPopupTitle).html(cgSelectedProgram.title);

    // highlight first button; unhighlight other buttons
    $(cgPopupElements[0]).removeClass("btn-secondary");
    $(cgPopupElements[0]).addClass("btn-primary");

    for (i = 1; i < cgPopupElements.length; i++) {
        $(cgPopupElements[i]).removeClass("btn-primary");
        $(cgPopupElements[i]).addClass("btn-secondary");
    }

    $(cgPopupId).off("keydown");
    $(cgPopupId).keydown(function (keyEvent) {
        var keyIdentifier = event.keyIdentifier;
        console.log("Key " + keyIdentifier.toString() + "pressed")
        if (keyIdentifier == "Up") {
            cgProgramDlgUp();
        }
        else if (keyIdentifier == "Down") {
            cgProgramDlgDown();
        }
        else if (keyIdentifier == "Enter") {
            var functionInvoked = cgPopupHandlers[cgPopupSelectedIndex]();
            cgProgramDlgCloseInvoked();
            // ?? JTRTODO - update scheduled recordings

        }
    });
    // browser event handlers - browser.js - this approach didn't work - why?
    //for (i = 0; i < cgPopupEpisodeElements.length; i++) {
    //    var foo = cgPopupEpisodeHandlers[i];
    //    var foo2 = cgPopupEpisodeElements[i];
    //    $(foo2).click(function () {
    //        foo();
    //    });

    //$(cgPopupEpisodeElements[i]).click(function () {
    //    //cgPopupEpisodeHandlers[i]();
    //    foo();
    //    cgProgramDlgCloseInvoked();
    //});

    //click(cgPopupEpisodeHandlers[i]);
    //}
}

function programsMatch(scheduledRecording, cgProgram, cgStationId) {

    // JTRTODO - what other criteria should be used?
    var channelGuide = ChannelGuideSingleton.getInstance();
    var channel = channelGuide.getChannelFromStationIndex(cgStationId);
    if (channel != scheduledRecording.Channel) return false;

    if (scheduledRecording.Title != cgSelectedProgram.title) return false;

    if (new Date(scheduledRecording.DateTime).getTime() != cgSelectedProgram.date.getTime()) return false;

    return true;
}

function cgModalClose() {
    // don't need to do anything other than close the dialog
    return "close";
}


// brightsign.js only?
function cgSelectEventHandler() {
    var functionInvoked = cgPopupHandlers[cgPopupSelectedIndex]();
    cgProgramDlgCloseInvoked();
    // ?? JTRTODO - update scheduled recordings
    return functionInvoked;
}


function cgProgramDlgUp() {

    if (cgPopupSelectedIndex > 0) {

        cgPopupSelectedIndex--;
        updateCGProgramDlgSelection();
    }
}


function cgProgramDlgDown() {
    if (cgPopupSelectedIndex < cgPopupElements.length - 1) {

        cgPopupSelectedIndex++;
        updateCGProgramDlgSelection();
    }
}


function cgProgramDlgCloseInvoked() {
    $(cgPopupId).modal('hide');
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
    else if (userAgent.indexOf("iPad") >= 0) {
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

        //baseURL = "http://10.10.212.44:8080/";
        baseURL = "http://192.168.2.9:8080/";

        console.log("baseURL from document.baseURI is: " + baseURL + ", baseIP is: " + baseIP);
    }
    else {
        initializeBrightSign();
    }

});