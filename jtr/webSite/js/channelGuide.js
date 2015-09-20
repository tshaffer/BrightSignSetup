var ChannelGuideSingleton = (function () {
    var channelGuideInstance;

    function createChannelGuideInstance() {
        var cgInstance = new ChannelGuide();
        return cgInstance;
    }

    return {
        getInstance: function () {
            if (!channelGuideInstance) {
                channelGuideInstance = createChannelGuideInstance();
            }
            return channelGuideInstance;
        }
    };
})();


function ChannelGuide() {

    this.epgProgramSchedule = null;
    this.epgProgramScheduleStartDateTime = null;

    this.channelGuideDisplayStartDateTime = null;
    this.channelGuideDisplayEndDateTime = null;
    this.channelGuideDisplayCurrentDateTime = null;
    this.channelGuideDisplayCurrentEndDateTime = null;

    this._currentSelectedProgramButton = null;
    this._currentStationIndex = null;

    this.widthOfThirtyMinutes = 240;    // pixels
    this.channelGuideHoursDisplayed = 3;

    this.resetSelectedProgram = true;
}


ChannelGuide.prototype.getSelectedStationAndProgram = function () {

    var programInfo = this.parseProgramId(this._currentSelectedProgramButton);
    var programStationData = this.epgProgramSchedule[programInfo.stationId];
    var programList = programStationData.programList;

    var programData = {};
    programData.stationId = programInfo.stationId;
    programData.program = programList[programInfo.programIndex];
    return programData;
}


ChannelGuide.prototype.reselectCurrentProgram = function() {
    this.selectProgram(null, this._currentSelectedProgramButton);
}


ChannelGuide.prototype.retrieveScheduledRecordings = function() {

    var self = ChannelGuideSingleton.getInstance();

    // get the scheduled recordings - this is independent of other code here so can be done asynchronously and independently for now

    // JTRTODO - this is now more questionable - if the user returned from a pop up, we need to update the scheduledRecordings data
    // before they select another item
    self.scheduledRecordings = null;
    var getScheduledRecordingsPromise = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledRecordings";

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = { "currentDateTime": currentDateTimeIso };

        console.log("retrieveScheduledRecordings: getScheduledRecordings invoked");

        $.get(
            aUrl,
            currentDateTime
        ).then(function (scheduledRecordings) {
                console.log("retrieveScheduledRecordings: getScheduledRecordings processing complete");
                self.scheduledRecordings = [];
                $.each(scheduledRecordings, function (index, scheduledRecording) {
                    self.scheduledRecordings.push(scheduledRecording);
                });
                resolve();
            }, function () {
                reject();
            });
    });

    getScheduledRecordingsPromise.then(function() {
        console.log("retrieveScheduledRecordings: scheduledRecordings retrieved from db");

        //// sort scheduled recordings by date
        //self.toDoList.sort(function (a, b) {
        //    var aStr = a.DateTime.toISOString();
        //    var bStr = b.DateTime.toISOString();
        //    if (aStr > bStr) {
        //        return 1;
        //    }
        //    else if (aStr < bStr) {
        //        return -1;
        //    }
        //    else {
        //        return 0;
        //    }
        //});
    }, function() {
        console.log("getScheduledRecordingsPromise error");
    });
}
ChannelGuide.prototype.selectChannelGuide = function() {

    // if returning from pop up modal, just re-select the last program and retrieve potentially modified scheduledRecordings
    if (!this.resetSelectedProgram) {
        this.selectProgram(null, this._currentSelectedProgramButton);
    }

    var self = this;

    // get the scheduled recordings - this is independent of other code here so can be done asynchronously and independently for now

    // JTRTODO - this is now more questionable - if the user returned from a pop up, we need to update the scheduledRecordings data
    // before they select another item
    self.scheduledRecordings = null;
    var getScheduledRecordingsPromise = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledRecordings";

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = { "currentDateTime": currentDateTimeIso };

        $.get(
            aUrl,
            currentDateTime
        ).then(function (scheduledRecordings) {
                self.scheduledRecordings = [];
                $.each(scheduledRecordings, function (index, scheduledRecording) {
                    self.scheduledRecordings.push(scheduledRecording);
                });
                resolve();
            }, function () {
                reject();
            });
    });

    getScheduledRecordingsPromise.then(function() {
        console.log("selectChannelGuide: scheduledRecordings retrieved from db");

        //// sort scheduled recordings by date
        //self.toDoList.sort(function (a, b) {
        //    var aStr = a.DateTime.toISOString();
        //    var bStr = b.DateTime.toISOString();
        //    if (aStr > bStr) {
        //        return 1;
        //    }
        //    else if (aStr < bStr) {
        //        return -1;
        //    }
        //    else {
        //        return 0;
        //    }
        //});
    }, function() {
        console.log("getScheduledRecordingsPromise error");
    });

    // if returning from pop up modal return now (after launching code to update scheduledRecordings)
    if (!this.resetSelectedProgram) {
        return;
    }

    if (this.epgProgramSchedule == null) {

        // first time displaying channel guide; retrieve epg data from database
        this.epgProgramSchedule = {};

        this.epgProgramScheduleStartDateTime = Date.today().set({ year: 2100, month: 0, day: 1, hour: 0 });

        // retrieve data from db starting on today's date
        var epgStartDate = Date.now().toString("yyyy-MM-dd");

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
                if (localDate < self.epgProgramScheduleStartDateTime) {
                    self.epgProgramScheduleStartDateTime = localDate;
                }

                // create program from data in db
                var program = {}
                program.date = localDate;
                program.endDateTime = sdProgram.endDateTime;
                program.title = sdProgram.Title;
                program.duration = sdProgram.Duration;
                program.episodeTitle = sdProgram.EpisodeTitle;
                program.shortDescription = sdProgram.ShortDescription;
                program.longDescription = sdProgram.LongDescription;
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
                if (sdProgram.SeasonEpisode == undefined) {
                    program.seasonEpisode = "";
                }
                else {
                    program.seasonEpisode = sdProgram.SeasonEpisode;
                }

                program.movieYear = sdProgram.movieYear;
                program.movieRating = sdProgram.movieRating;
                program.movieMinRating = sdProgram.movieMinRating;
                program.movieMaxRating = sdProgram.movieMaxRating;
                program.movieRatingIncrement = sdProgram.movieRatingIncrement;

                var aggregatedCastMembers = sdProgram.CastMembers;
                var castMembersArray = aggregatedCastMembers.split(',');
                var castMembers = "";
                $.each(castMembersArray, function (index, castMemberEntry) {
                    if (index > 0) {
                        castMembers += ", ";
                    }
                    castMembers += castMemberEntry.substring(2);
                });
                program.castMembers = castMembers;

                // append to program list for  this station (create new station object if necessary)
                var stationId = sdProgram.StationId;
                if (stationId == "undefined") {
                    debugger;
                }
                if (!(stationId in self.epgProgramSchedule)) {
                    var programStationData = {};
                    programStationData.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                    programStationData.programList = [];
                    self.epgProgramSchedule[stationId] = programStationData;
                }

                // append program to list of programs for this station
                var programList = self.epgProgramSchedule[stationId].programList;
                programList.push(program);
            });

            // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
            for (var stationId in self.epgProgramSchedule) {
                if (self.epgProgramSchedule.hasOwnProperty(stationId)) {
                    var programStationData = self.epgProgramSchedule[stationId];
                    var programList = programStationData.programList;
                    var programIndex = 0;

                    var programSlotIndices = [];

                    var lastProgram = null;

                    // 48 slots per day as each slot is 1/2 hour
                    for (var slotIndex = 0; slotIndex < 48 * numDaysEpgData; slotIndex++) {

                        var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;     // offset in minutes

                        while (true) {

                            // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                            if (programIndex >= programList.length) {
                                programSlotIndices.push(programIndex - 1);
                                break;
                            }

                            var program = programList[programIndex];

                            var programTimeOffsetSinceStartOfEPGData = msecToMinutes(program.date - self.epgProgramScheduleStartDateTime);

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
            self.initiateRenderChannelGuide();
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
        this.initiateRenderChannelGuide();
    }

    $("#cgData").keydown(function (keyEvent) {
        var keyIdentifier = event.keyIdentifier;
        if (keyIdentifier == "Right" || keyIdentifier == "Left" || keyIdentifier == "Up" || keyIdentifier == "Down") {
            self.navigateChannelGuide(keyIdentifier.toLowerCase());
            return false;
        }
        else if (keyIdentifier == "Enter") {
            displayCGPopUp();
            return false;
        }
    });
}


ChannelGuide.prototype.initiateRenderChannelGuide = function() {

    // display channel guide one station at a time, from current time for the duration of the channel guide
    getStations(this.renderChannelGuide);
}


ChannelGuide.prototype.renderChannelGuide = function() {

    var self = ChannelGuideSingleton.getInstance();

    // start date/time for channel guide display is current time, rounded down to nearest 30 minutes
    var currentDate = Date.now();
    var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
    var startHour = currentDate.getHours();

    self.channelGuideDisplayStartDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);

    self.channelGuideDisplayCurrentDateTime = new Date(self.channelGuideDisplayStartDateTime);
    self.channelGuideDisplayCurrentEndDateTime = new Date(self.channelGuideDisplayCurrentDateTime).addHours(3);

    self.renderChannelGuideAtDateTime();
}

// draw the channel guide, starting at this.channelGuideDisplayStartDateTime
ChannelGuide.prototype.renderChannelGuideAtDateTime = function() {

    // start date/time of data structure containing channel guide data
    var channelGuideDataStructureStartDateTime = this.epgProgramScheduleStartDateTime;

    // time difference between start of channel guide display and start of channel guide data
    var timeDiffInMinutes = msecToMinutes(this.channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime);

    // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
    var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

    var maxMinutesToDisplay = 0;
    var minutesToDisplay;

    var self = this;

    $.each(stations, function (stationIndex, station) {

        // channel guide data for this station
        var programStationData = self.epgProgramSchedule[station.StationId]

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
        // reduce the duration of the first show by this amount (time the show would have already been airing as of this time)
        timeDiffInMinutes = msecToMinutes(self.channelGuideDisplayStartDateTime - new Date(showToDisplay.date));

        programStationData.programUIElementIndices = [];

        var slotIndex = 0;
        var uiElementCount = 0;

        var toAppend = "";
        minutesToDisplay = 0;
        while (indexIntoProgramList < programList.length) {

            var durationInMinutes = Number(showToDisplay.duration);

            // perform reduction for only the first show in case it's already in progress at the beginning of this station's display
            if (toAppend == "") {
                durationInMinutes -= timeDiffInMinutes;
            }

            minutesToDisplay += durationInMinutes;

            var cssClasses = "";
            var widthSpec = "";
            if (durationInMinutes == 30) {
                cssClasses = "'btn-secondary thirtyMinuteButton'";
            }
            else if (durationInMinutes == 60) {
                cssClasses = "'btn-secondary sixtyMinuteButton'";
            }
            else {
                cssClasses = "'btn-secondary variableButton'";
                var width = (durationInMinutes / 30) * self.widthOfThirtyMinutes;
                widthSpec = " style='width:" + width.toString() + "px'";
            }
            var id = "show-" + station.StationId + "-" + indexIntoProgramList.toString();
            var title = showToDisplay.title;
            toAppend +=
                "<button id='" + id + "' class=" + cssClasses + widthSpec + ">" + title + "</button>";

            var programStartTime = minutesAlreadyDisplayed;                     // offset in minutes
            var programEndTime = minutesAlreadyDisplayed + durationInMinutes;   // offset in minutes
            var slotTime = slotIndex * 30;
            while (programStartTime <= slotTime && slotTime < programEndTime) {
                programStationData.programUIElementIndices[slotIndex] = uiElementCount;
                slotIndex++;
                slotTime = slotIndex * 30;
            }

            minutesAlreadyDisplayed += durationInMinutes;
            indexIntoProgramList++;
            showToDisplay = programList[indexIntoProgramList];

            uiElementCount++;
        }
        $(cgProgramLineName).append(toAppend);

        if (minutesToDisplay > maxMinutesToDisplay) {
            maxMinutesToDisplay = minutesToDisplay;
        }
    });

    this.updateTextAlignment();

    // build and display timeline
    var toAppend = "";
    $("#cgTimeLine").empty();
    var timeLineCurrentValue = this.channelGuideDisplayStartDateTime;
    var minutesDisplayed = 0;
    while (minutesDisplayed < maxMinutesToDisplay) {

        var timeLineTime = timeOfDay(timeLineCurrentValue);

        toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
        timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + minutesToMsec(30));
        minutesDisplayed += 30;
    }
    this.channelGuideDisplayEndDateTime = timeLineCurrentValue;

    $("#cgTimeLine").append(toAppend);

    // setup handlers on children for browser - when user clicks on program to record, etc.
    $("#cgData").click(function (event) {
        var buttonClicked = event.target;
        if (event.target.id != "") {
            // presence of an id means that it's not a timeline button
            var programInfo = self.parseProgramId($(event.target)[0]);
            var programStationData = self.epgProgramSchedule[programInfo.stationId];
            var programList = programStationData.programList;
            self.selectProgramTime = programList[programInfo.programIndex].date;

            // JTRTODO - linear search
            // get stationIndex
            $.each(stations, function (stationIndex, station) {
                if (station.StationId == programInfo.stationId) {

                    this._currentStationIndex = stationIndex;
                    self.selectProgram(self._currentSelectedProgramButton, event.target);

                    displayCGPopUp();

                    return false;
                }
            });
        }
    });

    var url = baseURL + "lastTunedChannel";

    var thisObj = this;
    $.get(url)
        .done(function (result) {
            consoleLog("lastTunedChannel successfully retrieved");
            var stationNumber = result;
            var stationIndex = thisObj.getStationIndexFromName(stationNumber)
            var stationRow = $("#cgData").children()[stationIndex + 1];
            thisObj._currentSelectedProgramButton = $(stationRow).children()[0];
            thisObj.selectProgram(null, thisObj._currentSelectedProgramButton, 0);
            thisObj._currentStationIndex = stationIndex;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            consoleLog("lastTunedChannel failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });
}


ChannelGuide.prototype.getSlotIndex = function(dateTime) {

    // compute the time difference between the new time and where the channel guide data begins (and could be displayed)
    var timeDiffInMinutes = msecToMinutes(dateTime.getTime() - this.channelGuideDisplayStartDateTime.getTime());

    // compute number of 30 minute slots to scroll
    var slotIndex = parseInt(timeDiffInMinutes / 30);
    if (slotIndex < 0) {
        slotIndex = 0;
    }
    return slotIndex;
}

ChannelGuide.prototype.scrollToTime = function(newScrollToTime) {

    var slotsToScroll = this.getSlotIndex(newScrollToTime);

    $("#cgData").scrollLeft(slotsToScroll * this.widthOfThirtyMinutes)

    this.channelGuideDisplayCurrentDateTime = newScrollToTime;
    this.channelGuideDisplayCurrentEndDateTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(this.channelGuideHoursDisplayed);
}

ChannelGuide.prototype.selectProgramAtTimeOnStation = function(selectProgramTime, stationIndex, currentUIElement) {

    this._currentStationIndex = stationIndex;

    var slotIndex = this.getSlotIndex(selectProgramTime);

    var station = stations[stationIndex];
    var stationId = station.StationId;
    var programStationData = this.epgProgramSchedule[stationId]

    var buttonIndex = programStationData.programUIElementIndices[slotIndex];

    // get the array of program buttons for this station
    var cgProgramsInStationRowElement = "#cgStation" + stationIndex.toString() + "Data";
    var programUIElementsInStation = $(cgProgramsInStationRowElement).children();       // programs in that row

    var nextActiveUIElement = programUIElementsInStation[buttonIndex];

    this.selectProgram(currentUIElement, nextActiveUIElement);
}

// get the index of the button in a row / div
ChannelGuide.prototype.getActiveButtonIndex = function(activeButton, buttonsInRow) {

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

ChannelGuide.prototype.updateActiveProgramUIElement = function(activeProgramUIElement, newActiveProgramUIElement) {

    if (activeProgramUIElement != null) {
        $(activeProgramUIElement).removeClass("btn-primary");
        $(activeProgramUIElement).addClass("btn-secondary");
    }

    $(newActiveProgramUIElement).removeClass("btn-secondary");
    $(newActiveProgramUIElement).addClass("btn-primary");

    $(newActiveProgramUIElement).focus();

    this._currentSelectedProgramButton = newActiveProgramUIElement;
}


ChannelGuide.prototype.parseProgramId = function (programUIElement) {

        var programInfo = {};

        var programId = programUIElement.id;
        var idParts = programId.split("-");
        programInfo.stationId = idParts[1];
        programInfo.programIndex = idParts[2];

        return programInfo;
}



ChannelGuide.prototype.updateProgramInfo = function (programUIElement) {

    var programInfo = this.parseProgramId($(programUIElement)[0]);

    var programStationData = this.epgProgramSchedule[programInfo.stationId];
    var programList = programStationData.programList;
    var selectedProgram = programList[programInfo.programIndex];

    // display title (prominently)
    $("#cgProgramName").text(selectedProgram.title);

    // display day/date of selected program in upper left of channel guide
    var programDayDate = dayDate(selectedProgram.date);
    $("#cgDayDate").text(programDayDate);

    $("#programInfo").empty();

    // day, date, and time
    var startTime = timeOfDay(selectedProgram.date);

    var endDate = new Date(selectedProgram.date.getTime()).addMinutes(selectedProgram.duration);
    var endTime = timeOfDay(endDate);

    var dateTimeInfo = programDayDate + " " + startTime + " - " + endTime;

    var episodeInfo = "";
    if (selectedProgram.showType == "Series" && selectedProgram.newShow == 0) {
        episodeInfo = "Rerun";
        if (selectedProgram.originalAirDate != "") {
            episodeInfo += ": original air date was " + selectedProgram.originalAirDate;
            if (selectedProgram.seasonEpisode != "") {
                episodeInfo += ", " + selectedProgram.seasonEpisode;
            }
        }
    }

    $("#cgDateTimeInfo").html(dateTimeInfo)

    var episodeTitle = selectedProgram.episodeTitle;
    if (episodeTitle == "") {
        episodeTitle = "<br/>";
    }
    $("#cgEpisodeTitle").html(episodeTitle)

    var programDescription = selectedProgram.longDescription;
    if (programDescription == "") {
        programDescription = selectedProgram.shortDescription;
    }
    if (programDescription == "") {
        programDescription = "<br/>";
    }
    $("#cgDescription").html(programDescription)

    var castMembers = selectedProgram.castMembers;
    if (castMembers == "") {
        castMembers = "<br/>";
    }
    $("#cgCastMembers").html(castMembers)

    if (episodeInfo == "") {
        episodeInfo = "<br/>";
    }
    $("#episodeInfo").html(episodeInfo)
}

ChannelGuide.prototype.selectProgram = function (activeProgramUIElement, newActiveProgramUIElement) {

    this.updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement);

    this.updateProgramInfo(newActiveProgramUIElement)

}

function dayDate(dateTime) {
    return dateTime.toString("ddd M/d");
}

function timeOfDay(dateTime) {
    //return dateTime.toString("h:mmtt").toLowerCase();

    // hack to work around apparent date.js bug where hour shows up as 0 inappropriately
    var hour = dateTime.toString("h");
    if (hour == "0") {
        hour = "12";
    }
    return hour + dateTime.toString(":mmtt").toLowerCase();
}


ChannelGuide.prototype.navigateBackwardOneScreen = function () {

    newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(-this.channelGuideHoursDisplayed);
    if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
        newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
    }

    this.scrollToTime(newScrollToTime)
    this.updateTextAlignment();

    this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
}


ChannelGuide.prototype.navigateBackwardOneDay = function () {

    newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(-24);
    if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
        newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
    }
    this.scrollToTime(newScrollToTime)
    this.updateTextAlignment();

    this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
}


ChannelGuide.prototype.navigateForwardOneScreen = function () {

    newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(this.channelGuideHoursDisplayed);
    var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
    if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
        newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
    }
    this.scrollToTime(newScrollToTime)
    this.updateTextAlignment();

    this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
}

ChannelGuide.prototype.navigateForwardOneDay = function () {

    newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(24);
    var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
    if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
        newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
    }
    this.scrollToTime(newScrollToTime)
    this.updateTextAlignment();

    this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
}

ChannelGuide.prototype.getProgramFromUIElement = function (element) {

    var programInfo = this.parseProgramId($(element)[0]);

    var programStationData = this.epgProgramSchedule[programInfo.stationId];
    var programList = programStationData.programList;
    var selectedProgram = programList[programInfo.programIndex];
    return selectedProgram;
}

ChannelGuide.prototype.isProgramStartVisible = function (element) {

    var program = this.getProgramFromUIElement(element);
    var programDate = program.date;

    if ((this.channelGuideDisplayCurrentDateTime <= programDate) && (programDate < this.channelGuideDisplayCurrentEndDateTime)) return true;

    return false;
}


ChannelGuide.prototype.isProgramEndVisible = function (element) {

    var program = this.getProgramFromUIElement(element);
    var programStartDateTime = program.date;
    var programEndDateTime = new Date(programStartDateTime.getTime() + program.duration * 60000);

    if (programEndDateTime > this.channelGuideDisplayCurrentEndDateTime) return false;
    if (programEndDateTime <= this.channelGuideDisplayCurrentDateTime) return false;

    return true;
}

ChannelGuide.prototype.navigateChannelGuide = function (direction) {

    // get div for current active button
    var activeStationRowUIElement = this._currentSelectedProgramButton.parentElement;           // current row of the channel guide
    var programUIElementsInStation = $(activeStationRowUIElement).children();                   // programs in that row

    var indexOfSelectedProgramElement = this.getActiveButtonIndex(this._currentSelectedProgramButton, programUIElementsInStation);
    if (indexOfSelectedProgramElement >= 0) {
        if (direction == "right") {

            var programEndIsVisible = this.isProgramEndVisible(this._currentSelectedProgramButton);

            // if the end of the current program is fully visible, go to the next program
            // if the start of the next program is not visible, scroll to the left by 30 minutes
            // select the next program
            if (programEndIsVisible) {
                var indexOfNewProgramElement = indexOfSelectedProgramElement + 1;
                if (indexOfNewProgramElement < $(programUIElementsInStation).length) {
                    var newProgramElement = $(programUIElementsInStation)[indexOfNewProgramElement];
                    var programStartIsVisible = this.isProgramStartVisible(newProgramElement);
                    if (!programStartIsVisible) {
                        newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(30);
                        this.scrollToTime(newScrollToTime);
                    }
                    this.updateTextAlignment();
                    this.selectProgram(this._currentSelectedProgramButton, newProgramElement);
                }
            }

                // else if the current program's end point is not visible, move forward by 30 minutes.
            else {
                newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(30);
                var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
                if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
                    newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
                }

                this.scrollToTime(newScrollToTime);
                this.updateTextAlignment();
            }

            // JTRTODO - check for limit on right side; either fetch more epg data or stop scrolling at the end
        }
        else if (direction == "left") {

            var programStartIsVisible = this.isProgramStartVisible(this._currentSelectedProgramButton);

            // if the start of the current program is fully visible, go to the prior program
            // if the end of the prior program is not visible, scroll to the right by 30 minutes
            // select the prior program
            if (programStartIsVisible) {
                if (indexOfSelectedProgramElement > 0) {
                    var indexOfNewProgramElement = indexOfSelectedProgramElement - 1;
                    if (indexOfNewProgramElement < $(programUIElementsInStation).length) {
                        var newProgramElement = $(programUIElementsInStation)[indexOfNewProgramElement];
                        var programEndIsVisible = this.isProgramEndVisible(newProgramElement);
                        if (!programEndIsVisible) {
                            newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(-30);
                            this.scrollToTime(newScrollToTime);
                        }
                        this.selectProgram(this._currentSelectedProgramButton, newProgramElement);
                        this.updateTextAlignment();
                    }
                }
            }

                // else if the current program's start point is not visible, move backward by 30 minutes.
            else {
                newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(-30);

                if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
                    newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
                }

                this.scrollToTime(newScrollToTime);
                this.updateTextAlignment();
            }
        }
        else if (direction == "down" || direction == "up") {
            if ((this._currentStationIndex < stations.length - 1 && direction == "down") || (this._currentStationIndex > 0 && direction == "up")) {

                var newRowIndex;
                if (direction == "down") {
                    newRowIndex = this._currentStationIndex + 1;
                }
                else {
                    newRowIndex = this._currentStationIndex - 1;
                }

                // when moving up/down, don't scroll
                // select the program at the same time
                // if that program's start is visible, the this.selectProgramTime is the start time of the current selected program
                // if it's not visible, the this.selectProgramTime is the current start of display of the channel guide
                var selectProgramTime;
                var programStartIsVisible = this.isProgramStartVisible(this._currentSelectedProgramButton);
                if (programStartIsVisible) {
                    var programInfo = this.parseProgramId(this._currentSelectedProgramButton);

                    var programStationData = this.epgProgramSchedule[programInfo.stationId];
                    var programList = programStationData.programList;
                    selectProgramTime = programList[programInfo.programIndex].date;
                }
                else {
                    selectProgramTime = this.channelGuideDisplayCurrentDateTime;
                }

                this.selectProgramAtTimeOnStation(selectProgramTime, newRowIndex, this._currentSelectedProgramButton);
                this.updateTextAlignment();
            }
        }
    }
}


ChannelGuide.prototype.updateTextAlignment = function () {

    var self = this;

    $.each(stations, function (stationIndex, station) {
        var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
        var cgProgramsOnStation = $(cgProgramLineName).children();
        $.each(cgProgramsOnStation, function (buttonIndex, cgProgramButton) {
            var programStartIsVisible = self.isProgramStartVisible(cgProgramButton);
            var programEndIsVisible = self.isProgramEndVisible(cgProgramButton);
            if (programStartIsVisible && programEndIsVisible) {
                $(cgProgramButton).css('text-align', 'center');
            }
            else if (programStartIsVisible) {
                $(cgProgramButton).css('text-align', 'left');
            }
            else if (programEndIsVisible) {
                $(cgProgramButton).css('text-align', 'right');
            }
            else {
                $(cgProgramButton).css('text-align', 'center');
            }
        });
    });
}


function getStationFromId(stationId) {

    var selectedStation = "";

    // get stationIndex
    $.each(stations, function (stationIndex, station) {
        if (station.StationId == stationId) {
            selectedStation = station.AtscMajor + "." + station.AtscMinor;
            return false;
        }
    });

    return selectedStation;
}


function getStationFromAtsc(stations, atscMajor, atscMinor) {

    var foundStation = null;

    $.each(stations, function (stationIndex, station) {
        if (station.AtscMajor == atscMajor && station.AtscMinor == atscMinor) {
            foundStation = station;
            return;
        }
    });

    return foundStation;
}


ChannelGuide.prototype.getStationIndexFromName = function(stationNumber) {

    var stationIndex = -1;

    $.each(stations, function (index, station) {
        if (stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
            stationIndex = index;
            return false;
        }
    });

    return stationIndex;

    //var stationIndex = looper.call(this, stationNumber);
    //return stationIndex;
}


ChannelGuide.prototype.getChannelFromStationIndex = function(stationId) {

    var channel = "";

    $.each(stations, function (index, station) {
        if (stationId == station.StationId) {
            channel = station.AtscMajor + "-" + station.AtscMinor;
            return false;
        }
    });

    return channel;
}

function looper(stationNumber) {

    var stationIndex = -1;

    $.each(stations, function (index, station) {
        if (stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
            stationIndex = index;
            return false;
        }
    });

    return stationIndex;
}

function stationNumbersEqual(stationNumber1, stationNumber2) {

    if (stationNumber1 == stationNumber2) return true;

    stationNumber1 = standardizeStationNumber(stationNumber1);
    stationNumber2 = standardizeStationNumber(stationNumber2);
    return (stationNumber1 == stationNumber2);
}

function standardizeStationNumber(stationNumber) {
    stationNumber = stationNumber.replace(".1", "");
    stationNumber = stationNumber.replace("-1", "");
    stationNumber = stationNumber.replace("-", ".");

    return stationNumber;
}

function standardizeStationNumber2(stationNumber) {
    stationNumber = stationNumber.replace(".1", "");
    stationNumber = stationNumber.replace("-1", "");
    stationNumber = stationNumber.replace(".", "-");

    return stationNumber;
}

