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

var epgProgramSchedule = null;
var epgProgramScheduleStartDateTime;

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function addMilliseconds(date, milliseconds) {
    return new Date(date.getTime() + milliseconds);
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
        "<td>" + position + "</td>";

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


function initiateRenderChannelGuide() {

    // display channel guide one station at a time, from current time for the duration of the channel guide
    getStations(renderChannelGuide);
}


function renderChannelGuide() {

    // start date/time for channel guide display is current time, rounded down to nearest 30 minutes
    var currentDate = new Date();
    var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
    var startHour = currentDate.getHours();
    var channelGuideDisplayStartDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);

    // start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDateTime = epgProgramScheduleStartDateTime;

    // time difference between start of channel guide display and start of channel guide data
    var timeDiffInMsec = channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime;
    var timeDiffInSeconds = timeDiffInMsec / 1000;
    var timeDiffInMinutes = timeDiffInSeconds / 60;

    // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
    var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

    // JTRTODO - remove me
    firstRow = true;

    var maxMinutesToDisplay = 0;
    var minutesToDisplay;

    $.each(stations, function (stationIndex, station) {

        // channel guide data for this station
        var programStationData = epgProgramSchedule[station.StationId]

        // iterate through initialShowsByTimeSlot to get programs to display
        var programSlotIndices = programStationData.initialShowsByTimeSlot;
        var programList = programStationData.programList;

        var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

        var minutesAlreadyDisplayed = 0;

        // build id of div containing the UI elements of the programs for the current station
        var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
        $(cgProgramLineName).empty();

        // first show to display for this station
        showToDisplay = programList[indexIntoProgramList];

        // calculate the time delta between the time of the channel guide display start and the start of the first show to display
        timeDiffInMsec = channelGuideDisplayStartDateTime - new Date(showToDisplay.date);
        var timeDiffInSeconds = timeDiffInMsec / 1000;
        var timeDiffInMinutes = timeDiffInSeconds / 60;
        // reduce the duration of the first show by this amount (time the show would have already been airing as of this time)

        var toAppend = "";
        minutesToDisplay = 0;
        while (indexIntoProgramList < programList.length) {
            try
            {
                var durationInMinutes = Number(showToDisplay.duration);
            }
            catch (err)
            {
                debugger;
            }
            // perform reduction for only the first show in case it's already in progress at the beginning of this station's display
            if (toAppend == "") {
                durationInMinutes -= timeDiffInMinutes;
            }

            minutesToDisplay += durationInMinutes;

            var cssClass = "";
            var widthSpec = "";
            if (durationInMinutes == 30) {
                cssClass = "'thirtyMinuteButton'";
            }
            else if (durationInMinutes == 60) {
                cssClass = "'sixtyMinuteButton'";
            }
            else {
                cssClass = "'variableButton'";
                var width = (durationInMinutes / 60) * 480;
                widthSpec = " style='width:" + width.toString() + "px'";
                // JTR TODO - maxWidth
            }
            var id = "show-" + station.StationId + "-" + indexIntoProgramList.toString();
            var title = showToDisplay.title;
            toAppend +=
                "<button id='" + id + "' class=" + cssClass + widthSpec + ">" + title + "</button>";

            minutesAlreadyDisplayed += durationInMinutes;
            indexIntoProgramList++;
            showToDisplay = programList[indexIntoProgramList];
        }
        $(cgProgramLineName).append(toAppend);

        if (minutesToDisplay > maxMinutesToDisplay) {
            maxMinutesToDisplay = minutesToDisplay;
        }
        // JTRTODO - setup handlers on children for browser - when user clicks on program to record, etc.

        // setup handlers on children - use for testing on Chrome
        var buttonsInCGLine = $(cgProgramLineName).children();
        $.each(buttonsInCGLine, function (buttonIndex, buttonInCGLine) {
            //$(buttonInCGLine).click({ recordingId: recordingId }, selectProgram);
            if (firstRow && buttonIndex == 0) {
                $(buttonInCGLine).focus();
                firstRow = false;
                lastActiveButton = buttonInCGLine;
            }
        });

        // JTRTODO - change in the future - different algorithm for selecting which program to highlight first
        //$(lastActiveButton).removeClass("btn-secondary");
        //$(lastActiveButton).addClass("btn-primary");

        //$(lastActiveButton).focus();
        selectProgram(null, lastActiveButton);
    });

    // build and display timeline
    var toAppend = "";
    $("#cgTimeLine").empty();
    var timeLineCurrentValue = channelGuideDisplayStartDateTime;
    var minutesDisplayed = 0;
    while (minutesDisplayed < maxMinutesToDisplay) {

        var timeLineTime = timeOfDay(timeLineCurrentValue);

        //toAppend += "<span class='thirtyMinuteTime'>" + timeLineTime + "</span>";
        toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
        timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + 30 * 60000);
        minutesDisplayed += 30;
    }
    $("#cgTimeLine").append(toAppend);


}


// get the index of the button in a row / div
function getActiveButtonIndex(activeButton, buttonsInRow) {

    var positionOfActiveElement = $(activeButton).position();

    var indexOfActiveButton = -1;
    $.each(buttonsInRow, function (buttonIndex, buttonInRow) {
        var buttonPosition = $(buttonInRow).position();
        if (buttonPosition.left == positionOfActiveElement.left) {
            indexOfActiveButton = buttonIndex;
            return false;
        }
    });
    return indexOfActiveButton;
}

function getActiveRowIndex(activeRow) {

    var rowPosition = $(activeRow).position();

    var cgStationDiv = activeRow.parentElement;
    var stationDivs = $(cgStationDiv).children();
    var indexOfActiveRow = -1;
    $.each(stationDivs, function (stationDivIndex, stationDiv) {
        if (stationDivIndex > 0) {          // div 0 is the timeline; skip it
            var stationDivPosition = $(stationDiv).position();
            if (stationDivPosition.top == rowPosition.top) {
                indexOfActiveRow = stationDivIndex;
                return false;
            }
        }
    });
    return indexOfActiveRow - 1;    // 0 is the first station
}

function updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement) {

    if (activeProgramUIElement != null) {
        $(activeProgramUIElement).removeClass("btn-primary");
        $(activeProgramUIElement).addClass("btn-secondary");
    }

    $(newActiveProgramUIElement).removeClass("btn-secondary");
    $(newActiveProgramUIElement).addClass("btn-primary");

    $(newActiveProgramUIElement).focus();

    lastActiveButton = newActiveProgramUIElement;
}

function selectProgram(activeProgramUIElement, newActiveProgramUIElement) {

    updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement);

    var programId = $(newActiveProgramUIElement)[0].id;
    var idParts = programId.split("-");
    var stationId = idParts[1];
    var programIndex = idParts[2];

    var programStationData = epgProgramSchedule[stationId];
    var programList = programStationData.programList;
    var selectedProgram = programList[programIndex];

    // display day/date of selected program in upper left of channel guide
    var programDayDate = dayDate(selectedProgram.date);
    $("#cgDayDate").text(programDayDate);

    $("#programInfo").empty();

     // day, date, and time
    var startTime = timeOfDay(selectedProgram.date);

    var endDate = new Date(selectedProgram.date.getTime() + selectedProgram.duration * 60000);
    var endTime = timeOfDay(endDate);

    var dateTimeInfo = programDayDate + " " + startTime + " - " + endTime;

   // program title, episode title, and description, and episode info
    var programInfo = selectedProgram.title;
    programInfo += "<br>";

    if (selectedProgram.episodeTitle != "") {
        programInfo += '"' + selectedProgram.episodeTitle + '"';
    }
    programInfo += "<br>";
    if (selectedProgram.description != "") {
        programInfo += selectedProgram.description;
    }
    programInfo += "<br>";
    
    if (selectedProgram.castMembers != 'none') {
        programInfo += selectedProgram.castMembers;        
    }
    programInfo += "<br>";        
    
    var episodeInfo = "";
    if (selectedProgram.showType == "Series" && selectedProgram.newShow == 0) {
        episodeInfo = "Rerun.";
        if (selectedProgram.originalAirDate != "") {
            episodeInfo += " The original air date was " + selectedProgram.originalAirDate;
            if (selectedProgram.gracenoteSeasonEpisode != "") {
                episodeInfo += ", " + selectedProgram.gracenoteSeasonEpisode;
            }
        }
    }
    programInfo += episodeInfo + "<br>";

    var htmlContent = "<p>";
    htmlContent += dateTimeInfo;
    htmlContent += "<br>";
    htmlContent += programInfo;
    htmlContent += "</p>";

    $("#programInfo").html(htmlContent);

}

function dayDate(dateTime) {
    var dayInWeek = dayOfWeek(dateTime);
    var month = (dateTime.getMonth() + 1).toString();
    var date = dateTime.getDate().toString();

    return dayInWeek + " " + month + "/" + date;
}

function dayOfWeek(dateTime) {
    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    return weekday[dateTime.getDay()];
}

function timeOfDay(dateTime) {

    var hoursLbl = "";
    var amPm = " am";
    var hours = dateTime.getHours();
    if (hours == 0) {
        hoursLbl = "12";
    }
    else if (hours < 12) {
        hoursLbl = hours.toString();
    }
    else if (hours == 12) {
        hoursLbl = "12";
        amPm = "pm";
    }
    else {
        hoursLbl = (hours - 12).toString();
        amPm = "pm";
    }

    var minutesLbl = twoDigitFormat(dateTime.getMinutes().toString());

    return (hoursLbl + ":" + minutesLbl + amPm);
}


function navigateChannelGuide(direction) {

    // JTRTODO
    //          var currentElement = document.activeElement;
    var activeProgramUIElement = lastActiveButton;
    // JTRTODO - the following may be necessary for some tbd functionality??
    //var currentElementId = currentElement.id;

    // get div for current active button
    var activeStationRowUIElement = activeProgramUIElement.parentElement;           // current row of the channel guide
    var programUIElementsInStation = $(activeStationRowUIElement).children();       // programs in that row
    var programUIElementPosition = $(activeProgramUIElement).position();            // returns members 'top' and 'left'
    var allRowsUIElement = activeStationRowUIElement.parentElement;                 // element representing all rows (why not just use #cgData)
    var stationRowsUIElements = $(allRowsUIElement).children();                     // stations in the channel guide (the rows)

    var indexOfActiveProgramUIElement = getActiveButtonIndex(activeProgramUIElement, programUIElementsInStation);
    if (indexOfActiveProgramUIElement >= 0) {
        if (direction == "right") {
            // JTRTODO - check for limit on right side; either fetch more epg data or stop scrolling at the end
            var indexOfNewProgramUIElement = indexOfActiveProgramUIElement + 1;
            if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                selectProgram(activeProgramUIElement, newActiveProgramUIElement);
            }
        }
        else if (direction == "left") {
            if (indexOfActiveProgramUIElement > 0) {
                var indexOfNewProgramUIElement = indexOfActiveProgramUIElement - 1;
                if (indexOfNewProgramUIElement < $(programUIElementsInStation).length) {
                    var newActiveProgramUIElement = $(programUIElementsInStation)[indexOfNewProgramUIElement];
                    selectProgram(activeProgramUIElement, newActiveProgramUIElement);
                }
            }
        }
        else if (direction == "down" || direction == "up") {
            var xPosition = programUIElementPosition.left;
            var activeRowIndex = getActiveRowIndex(activeStationRowUIElement);
            if ((activeRowIndex < stations.length - 1 && direction == "down")  || (activeRowIndex > 0 && direction == "up")) {

                var newRowIndex;
                if (direction == "down") {
                    newRowIndex = activeRowIndex + 1;
                }
                else {
                    newRowIndex = activeRowIndex - 1;
                }

                // find program whose x value is closest to the x value of the last program
                var newActiveRow = stationRowsUIElements[newRowIndex + 1];
                var programsInStation = $(newActiveRow).children();

                var minDistance = 1920;
                $.each(programsInStation, function (programInStationIndex, programInStation) {
                    var programPosition = $(programInStation).position();
                    var xProgramPosition = programPosition.left;
                    var distanceFromPreviousProgram = Math.abs(xProgramPosition - xPosition);
                    if (distanceFromPreviousProgram < minDistance) {
                        minDistance = distanceFromPreviousProgram;
                        newActiveProgram = programInStation;
                    }
                });
                selectProgram(activeProgramUIElement, newActiveProgram);
            }
        }
    }
}

function displayChannelGuide() {

    if (epgProgramSchedule == null) {

        // first time displaying channel guide; retrieve epg data from database
        epgProgramSchedule = {};

        epgProgramScheduleStartDateTime = new Date();
        epgProgramScheduleStartDateTime.setFullYear(2100, 0, 0);

        // retrieve data from db starting on today's date
        var startDate = new Date();
        var year = startDate.getFullYear().toString();
        var month = (startDate.getMonth() + 1).toString();
        var dayInMonth = startDate.getDate().toString();
        var epgStartDate = year + "-" + twoDigitFormat(month) + "-" + twoDigitFormat(dayInMonth);
        var url = baseURL + "getEpg";
        var epgData = { "startDate": epgStartDate };
        $.get(url, epgData)
        .done(function (result) {

            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpg success ************************************");

            // for each station, generate an ordered list (by airDateTime) of all shows in the current epg data
            $.each(result, function (index, sdProgram) {

                // convert to local time zone
                var localDate = new Date(sdProgram.AirDateTime);

                // capture the earliest date in the epg data (in local time, so may be earlier than date passed to db)
                if (localDate < epgProgramScheduleStartDateTime) {
                    epgProgramScheduleStartDateTime = localDate;
                }

                // create program from data in db
                var program = {}
                program.date = localDate;
                //program.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                program.title = sdProgram.Title;
                program.duration = sdProgram.Duration;
                program.episodeTitle = sdProgram.EpisodeTitle;
                program.description = sdProgram.Description;
                program.showType = sdProgram.ShowType;

                if (sdProgram.NewShow == undefined) {
                    program.newShow = 1;
                }
                else {
                    program.newShow = sdProgram.NewShow;
                }
                if (sdProgram.OriginalAirDate == undefined) {
                    program.originalAirDate = "";
                }
                else {
                    program.originalAirDate = sdProgram.OriginalAirDate;
                }
                if (sdProgram.GracenoteSeasonEpisode == undefined) {
                    program.gracenoteSeasonEpisode = "";
                }
                else {
                    program.gracenoteSeasonEpisode = sdProgram.GracenoteSeasonEpisode;
                }
                
                var aggregatedCastMembers = sdProgram.CastMembers;
                var castMembersArray = aggregatedCastMembers.split(',');
                var castMembers = "";
                $.each(castMembersArray, function (index, castMemberEntry) {
                    if (index > 0) {
                        castMembers += ", ";
                    }
                    castMembers += castMemberEntry.substring(2);
                });
                if (castMembers != "") {
                    console.log(castMembers);
                }
                program.castMembers = castMembers;
                
                // append to program list for  this station (create new station object if necessary)
                var stationId = sdProgram.StationId;
                if (stationId == "undefined") {
                    debugger;
                }
                if (!(stationId in epgProgramSchedule)) {
                    var programStationData = {};
                    programStationData.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                    programStationData.programList = [];
                    epgProgramSchedule[stationId] = programStationData;
                }

                // append program to list of programs for this station
                var programList = epgProgramSchedule[stationId].programList;
                programList.push(program);
            });

            // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
            for (var stationId in epgProgramSchedule)
            {
                if (epgProgramSchedule.hasOwnProperty(stationId)) {
                    var programStationData = epgProgramSchedule[stationId];
                    var programList = programStationData.programList;
                    var programIndex = 0;

                    var programSlotIndices = [];

                    var lastProgram = null;

                    for (var slotIndex = 0; slotIndex < 48 * numDaysEpgData; slotIndex++) {

                        var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;

                        while (true) {

                            // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                            if (programIndex >= programList.length) {
                                programSlotIndices.push(programIndex - 1);
                                break;
                            }

                            var program = programList[programIndex];

                            var programTimeOffsetSinceStartOfEPGData = (program.date - epgProgramScheduleStartDateTime) / 60000; // minutes

                            if (programTimeOffsetSinceStartOfEPGData == slotTimeOffsetSinceStartOfEpgData) {
                                // program starts at exactly this time slot
                                programSlotIndices.push(programIndex);
                                programIndex++;
                                lastProgram = program;
                                break;
                            }
                            else if (programTimeOffsetSinceStartOfEPGData > slotTimeOffsetSinceStartOfEpgData) {
                                // this program starts at some time after the current time slot - use prior show when navigating to this timeslot
                                if (lastProgram != null) {
                                    lastProgram.indexIntoProgramList = programIndex - 1;
                                }
                                programSlotIndices.push(programIndex - 1);
                                // leave program index as it is - wait for timeslot to catch up
                                break;
                            }
                            else if (programTimeOffsetSinceStartOfEPGData < slotTimeOffsetSinceStartOfEpgData) {
                                // this program starts at sometime before the current time slot - continue to look for the last show that starts before the current time slot (or == to the current time slot)
                                programIndex++;
                                lastProgram = program;
                            }
                        }
                    }

                    programStationData.initialShowsByTimeSlot = programSlotIndices;
                }
            }

            switchToPage("channelGuidePage");
            initiateRenderChannelGuide();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("getEpg failure");
        })
        .always(function () {
        });
    }
    else {
        switchToPage("channelGuidePage");
        initiateRenderChannelGuide();
    }
        
    $( "#cgData" ).keydown(function(keyEvent) {
        var keyIdentifier = event.keyIdentifier;
        if (keyIdentifier == "Right" || keyIdentifier == "Left" || keyIdentifier == "Up" || keyIdentifier == "Down") {
            console.log("keyIdentifier " + event.keyIdentifier);
            navigateChannelGuide(keyIdentifier.toLowerCase());
            return false;
        }

    });
}

function selectChannelGuide() {

    // initializeEpgData();
    
    displayChannelGuide();
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