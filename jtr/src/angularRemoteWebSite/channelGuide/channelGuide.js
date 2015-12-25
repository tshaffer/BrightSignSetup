/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('channelGuide', ['$scope', 'jtrServerService', 'jtrStationsService', 'jtrBroadcastService','jtrEpgFactory', function($scope, $jtrServerService, $jtrStationsService, $jtrBroadcastService, $jtrEpgFactory) {

    $scope.getProgramScheduleStartDateTime = function() {
        return $scope.epgProgramScheduleStartDateTime;
    };

    $scope.getProgramStationData = function(stationId) {
        return $scope.epgProgramSchedule[stationId];
    };

    $scope.getProgramSlotIndices = function(stationId) {
        var programStationData = $scope.epgProgramSchedule[stationId];
        var programSlotIndices = programStationData.initialShowsByTimeSlot;
        return programSlotIndices;
    };

    $scope.updateTextAlignment = function () {

        angular.forEach($scope.stations, function(station, stationIndex) {
            var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
            var cgProgramsOnStation = $(cgProgramLineName).children();
            angular.forEach(cgProgramsOnStation, function(cgProgramButton, buttonIndex) {
                var programStartIsVisible = $scope.isProgramStartVisible(cgProgramButton);
                var programEndIsVisible = $scope.isProgramEndVisible(cgProgramButton);
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
    };

    $scope.parseProgramId = function (programUIElement) {

        var programInfo = {};

        var programId = programUIElement.id;
        var idParts = programId.split("-");
        programInfo.stationId = idParts[1];
        programInfo.programIndex = idParts[2];

        return programInfo;
    };

    $scope.getProgramFromUIElement = function (element) {

        var programInfo = $scope.parseProgramId($(element)[0]);

        var programList = $scope.getProgramList(programInfo.stationId);
        var selectedProgram = programList[programInfo.programIndex];
        return selectedProgram;
    };

    $scope.isProgramStartVisible = function (element) {

        var program = $scope.getProgramFromUIElement(element);
        var programDate = program.date;

        if (($scope.channelGuideDisplayCurrentDateTime <= programDate) && (programDate < $scope.channelGuideDisplayCurrentEndDateTime)) return true;

        return false;
    };

    $scope.isProgramEndVisible = function (element) {

        var program = $scope.getProgramFromUIElement(element);
        var programStartDateTime = program.date;
        var programEndDateTime = new Date(programStartDateTime.getTime() + program.duration * 60000);

        if (programEndDateTime > $scope.channelGuideDisplayCurrentEndDateTime) return false;
        if (programEndDateTime <= $scope.channelGuideDisplayCurrentDateTime) return false;

        return true;
    };

    $scope.selectProgram = function (activeProgramUIElement, newActiveProgramUIElement) {

        $scope.updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement);

        $scope.updateProgramInfo(newActiveProgramUIElement)
    };

    $scope.updateActiveProgramUIElement = function (activeProgramUIElement, newActiveProgramUIElement) {

        if (activeProgramUIElement != null) {
            $(activeProgramUIElement).removeClass("btn-primary");
            $(activeProgramUIElement).addClass("btn-secondary");
        }

        $(newActiveProgramUIElement).removeClass("btn-secondary");
        $(newActiveProgramUIElement).addClass("btn-primary");

        $(newActiveProgramUIElement).focus();

        $scope._currentSelectedProgramButton = newActiveProgramUIElement;
    }

    $scope.getProgramList = function(stationId) {
        var programStationData = $scope.epgProgramSchedule[stationId];
        return programStationData.programList;
    }

    $scope.updateProgramInfo = function (programUIElement) {

        var programInfo = $scope.parseProgramId($(programUIElement)[0]);

        var programList = $scope.getProgramList(programInfo.stationId);
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


    $scope.getSlotIndex = function (dateTime) {

        // compute the time difference between the new time and where the channel guide data begins (and could be displayed)
        var timeDiffInMinutes = msecToMinutes(dateTime.getTime() - $scope.channelGuideDisplayStartDateTime.getTime());

        // compute number of 30 minute slots to scroll
        var slotIndex = parseInt(timeDiffInMinutes / 30);
        if (slotIndex < 0) {
            slotIndex = 0;
        }
        return slotIndex;
    }

    $scope.scrollToTime = function (newScrollToTime) {

        var slotsToScroll = $scope.getSlotIndex(newScrollToTime);

        $("#cgData").scrollLeft(slotsToScroll * $scope.widthOfThirtyMinutes)

        $scope.channelGuideDisplayCurrentDateTime = newScrollToTime;
        $scope.channelGuideDisplayCurrentEndDateTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours($scope.channelGuideHoursDisplayed);
    },


    $scope.selectProgramAtTimeOnStation = function (selectProgramTime, stationIndex, currentUIElement) {

        $scope._currentStationIndex = stationIndex;

        var slotIndex = $scope.getSlotIndex(selectProgramTime);

        var station = $scope.stations[stationIndex];
        var stationId = station.StationId;

        var programStationData = $scope.getProgramStationData(stationId);
        var buttonIndex = programStationData.programUIElementIndices[slotIndex];

        // get the array of program buttons for this station
        var cgProgramsInStationRowElement = "#cgStation" + stationIndex.toString() + "Data";
        var programUIElementsInStation = $(cgProgramsInStationRowElement).children();       // programs in that row

        var nextActiveUIElement = programUIElementsInStation[buttonIndex];

        $scope.selectProgram(currentUIElement, nextActiveUIElement);
    }

    $scope.getSelectedStationAndProgram = function () {

        var programInfo = $scope.parseProgramId($scope._currentSelectedProgramButton);
        var programList = $scope.getProgramList(programInfo.stationId);

        var programData = {};
        programData.stationId = programInfo.stationId;
        programData.program = programList[programInfo.programIndex];
        return programData;
    }

    $scope.navigateBackwardOneScreen = function () {

        newScrollToTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours(-$scope.channelGuideHoursDisplayed);
        if (newScrollToTime < $scope.channelGuideDisplayStartDateTime) {
            newScrollToTime = new Date($scope.channelGuideDisplayStartDateTime);
        }

        $scope.scrollToTime(newScrollToTime)
        $scope.updateTextAlignment();

        $scope.selectProgramAtTimeOnStation(newScrollToTime, $scope._currentStationIndex, $scope._currentSelectedProgramButton);
    }


    $scope.navigateBackwardOneDay = function () {

        newScrollToTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours(-24);
        if (newScrollToTime < $scope.channelGuideDisplayStartDateTime) {
            newScrollToTime = new Date($scope.channelGuideDisplayStartDateTime);
        }
        $scope.scrollToTime(newScrollToTime)
        $scope.updateTextAlignment();

        $scope.selectProgramAtTimeOnStation(newScrollToTime, $scope._currentStationIndex, $scope._currentSelectedProgramButton);
    }


    $scope.navigateForwardOneScreen = function () {

        newScrollToTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours($scope.channelGuideHoursDisplayed);
        var proposedEndTime = new Date(newScrollToTime).addHours($scope.channelGuideHoursDisplayed);
        if (proposedEndTime > $scope.channelGuideDisplayEndDateTime) {
            newScrollToTime = new Date($scope.channelGuideDisplayEndDateTime).addHours(-$scope.channelGuideHoursDisplayed);
        }
        $scope.scrollToTime(newScrollToTime)
        $scope.updateTextAlignment();

        $scope.selectProgramAtTimeOnStation(newScrollToTime, $scope._currentStationIndex, $scope._currentSelectedProgramButton);
    }


    $scope.navigateForwardOneDay = function () {

        newScrollToTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours(24);
        var proposedEndTime = new Date(newScrollToTime).addHours($scope.channelGuideHoursDisplayed);
        if (proposedEndTime > $scope.channelGuideDisplayEndDateTime) {
            newScrollToTime = new Date($scope.channelGuideDisplayEndDateTime).addHours(-$scope.channelGuideHoursDisplayed);
        }
        $scope.scrollToTime(newScrollToTime)
        $scope.updateTextAlignment();

        $scope.selectProgramAtTimeOnStation(newScrollToTime, $scope._currentStationIndex, $scope._currentSelectedProgramButton);
    }


    $scope.show = function() {

        console.log("channelGuide::show()");
        var currentDate = new Date();
        var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
        var startHour = currentDate.getHours();

        $scope.channelGuideDisplayStartDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);
        $scope.channelGuideDisplayCurrentDateTime = new Date($scope.channelGuideDisplayStartDateTime);
        $scope.channelGuideDisplayCurrentEndDateTime = new Date($scope.channelGuideDisplayCurrentDateTime).addHours(3);

        // start date/time of data structure containing channel guide data
        var channelGuideDataStructureStartDateTime = $scope.getProgramScheduleStartDateTime();

        // time difference between start of channel guide display and start of channel guide data
        var timeDiffInMinutes = msecToMinutes($scope.channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime);

        // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
        var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

        var maxMinutesToDisplay = 0;
        var minutesToDisplay;

        angular.forEach($scope.stations, function(station, stationIndex) {

            var cgProgramsOnStation = {};
            cgProgramsOnStation.stationData = station;
            $scope.cgData.push(cgProgramsOnStation);

            // iterate through initialShowsByTimeSlot to get programs to display
            var programSlotIndices = $scope.getProgramSlotIndices(station.StationId);

            var programList = $scope.getProgramList(station.StationId);

            var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

            var minutesAlreadyDisplayed = 0;

            // build id of div containing the UI elements of the programs for the current station
            var cgProgramLineName = "#cgProgramsOnStation" + stationIndex.toString() + "Data";
            $(cgProgramLineName).empty();

            // first show to display for this station
            showToDisplay = programList[indexIntoProgramList];

            // calculate the time delta between the time of the channel guide display start and the start of the first show to display
            // reduce the duration of the first show by this amount (time the show would have already been airing as of this time)
            timeDiffInMinutes = msecToMinutes($scope.channelGuideDisplayStartDateTime - new Date(showToDisplay.date));

            var programStationData = $scope.getProgramStationData(station.StationId);
            programStationData.programUIElementIndices = [];

            var slotIndex = 0;
            var uiElementCount = 0;

            //var toAppend = "";
            var firstShowOnStation = true;
            minutesToDisplay = 0;

            cgProgramsOnStation.programs = [];

            while (indexIntoProgramList < programList.length) {

                showToDisplay.indexIntoProgramList = indexIntoProgramList;
                cgProgramsOnStation.programs.push(showToDisplay);

                var durationInMinutes = Number(showToDisplay.duration);

                // perform reduction for only the first show in case it's already in progress at the beginning of this station's display
                if (firstShowOnStation) {
                    durationInMinutes -= timeDiffInMinutes;
                    firstShowOnStation = false;
                }
                showToDisplay.durationInMinutes = durationInMinutes;

                minutesToDisplay += durationInMinutes;

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

            if (minutesToDisplay > maxMinutesToDisplay) {
                maxMinutesToDisplay = minutesToDisplay;
            }
        });

        $scope.updateTextAlignment();

        // build and display timeline
        var toAppend = "";
        $("#cgTimeLine").empty();
        var timeLineCurrentValue = $scope.channelGuideDisplayStartDateTime;
        var minutesDisplayed = 0;
        while (minutesDisplayed < maxMinutesToDisplay) {

            var timeLineTime = timeOfDay(timeLineCurrentValue);

            toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
            timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + minutesToMsec(30));
            minutesDisplayed += 30;
        }
        $scope.channelGuideDisplayEndDateTime = timeLineCurrentValue;

        $("#cgTimeLine").append(toAppend);

        // setup handlers on children for browser - when user clicks on program to record, etc.
        $("#cgData").click(function (event) {
            var buttonClicked = event.target;
            if (event.target.id != "") {
                // presence of an id means that it's not a timeline button
                var programInfo = $scope.parseProgramId($(event.target)[0]);
                var programList = $scope.getProgramList(programInfo.stationId);
                $scope.selectProgramTime = programList[programInfo.programIndex].date;

                var stationIndex = $jtrStationsService.getStationIndex(programInfo.stationId);
                if (stationIndex >= 0) {
                    $scope._currentStationIndex = stationIndex;
                    $scope.selectProgram($scope._currentSelectedProgramButton, event.target);
                    var programData = $scope.getSelectedStationAndProgram();

                    $jtrBroadcastService.broadcastMsg("cgRecordings", programData);
                }
            }
        });

        var promise = $jtrServerService.retrieveLastTunedChannel();
        promise.then(function(result) {
            console.log("lastTunedChannel successfully retrieved");
            var stationNumber = result.data;
            var stationIndex = $jtrStationsService.getStationIndexFromName(stationNumber)
            var stationRow = $("#cgData").children()[stationIndex + 1];
            $scope._currentSelectedProgramButton = $(stationRow).children()[0];
            $scope.selectProgram(null, $scope._currentSelectedProgramButton, 0);
            $scope._currentStationIndex = stationIndex;
        });

    }

    $scope.name = 'Channel Guide';
    console.log($scope.name + " screen displayed");

    $scope.cgData = [];

    $scope.getEpgDataPromise = null;

    $scope.stations = $jtrStationsService.getStationsResult();

    // initialize epg data
    $scope.numDaysEpgData = 3;
    //$scope.retrieveEpgData();
    var promise = $jtrEpgFactory.retrieveEpgData();
    promise.then(function() {
        console.log("jtrEpgFactory returned success");

        $scope.epgProgramSchedule = $jtrEpgFactory.getEpgProgramSchedule();
        $scope.epgProgramScheduleStartDateTime = $jtrEpgFactory.getEpgProgramScheduleStartDateTime();

        // from view
        $scope.channelGuideDisplayStartDateTime = null;
        $scope.channelGuideDisplayEndDateTime = null;
        $scope.channelGuideDisplayCurrentDateTime = null;
        $scope.channelGuideDisplayCurrentEndDateTime = null;

        $scope._currentSelectedProgramButton = null;
        $scope._currentStationIndex = null;

        $scope.widthOfThirtyMinutes = 240;    // pixels
        $scope.channelGuideHoursDisplayed = 3;

        $scope.show();
    });

}]);

