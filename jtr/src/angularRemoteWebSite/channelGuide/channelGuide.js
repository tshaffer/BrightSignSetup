/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('channelGuide', ['$scope', '$http', 'jtrServerService', function($scope, $http, $jtrServerService) {

    $scope.retrieveStations = function() {
        $scope.getStationsPromise = $jtrServerService.getStations();
        $scope.getStationsPromise.then(function(result) {
            console.log("getStations success");

            angular.forEach(result.data, function(station, index) {
                $scope.stations[index] = station;
            });
            return;
        }, function(reason) {
            console.log("getStations failure");
        });
    };

    $scope.retrieveEpgData = function() {
        $scope.epgProgramSchedule = {};
        $scope.epgProgramScheduleStartDateTime = Date.today().set({year: 2100, month: 0, day: 1, hour: 0});

        $scope.getEpgDataPromise = $jtrServerService.getEpgData();
        $scope.getEpgDataPromise.then(function(result) {
            console.log("getEpgData success");

            angular.forEach(result.data, function(sdProgram, index) {

                // convert to local time zone
                var localDate = new Date(sdProgram.AirDateTime);

                // capture the earliest date in the epg data (in local time, so may be earlier than date passed to db)
                if (localDate < $scope.epgProgramScheduleStartDateTime) {
                    $scope.epgProgramScheduleStartDateTime = localDate;
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
                angular.forEach(castMembersArray, function (castMemberEntry, index) {
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
                if (!(stationId in $scope.epgProgramSchedule)) {
                    var programStationData = {};
                    programStationData.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                    programStationData.programList = [];
                    $scope.epgProgramSchedule[stationId] = programStationData;
                }

                // append program to list of programs for this station
                var programList = $scope.epgProgramSchedule[stationId].programList;
                programList.push(program);

                // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
                for (var stationId in $scope.epgProgramSchedule) {
                    if ($scope.epgProgramSchedule.hasOwnProperty(stationId)) {
                        var programStationData = $scope.epgProgramSchedule[stationId];
                        var programList = programStationData.programList;
                        var programIndex = 0;

                        var programSlotIndices = [];

                        var lastProgram = null;

                        // 48 slots per day as each slot is 1/2 hour
                        for (var slotIndex = 0; slotIndex < 48 * $scope.numDaysEpgData; slotIndex++) {

                            var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;     // offset in minutes

                            while (true) {

                                // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                                if (programIndex >= programList.length) {
                                    programSlotIndices.push(programIndex - 1);
                                    break;
                                }

                                var program = programList[programIndex];

                                var programTimeOffsetSinceStartOfEPGData = msecToMinutes(program.date - $scope.epgProgramScheduleStartDateTime);

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
            });
            console.log("retrieveEpgData complete");
            return;
        }, function(reason) {
            console.log("getEpgData failure");
        });
    };

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

    $scope.getProgramList = function(stationId) {
        var programStationData = $scope.epgProgramSchedule[stationId];
        return programStationData.programList;
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

            // iterate through initialShowsByTimeSlot to get programs to display
            var programSlotIndices = $scope.getProgramSlotIndices(station.StationId);

            var programList = $scope.getProgramList(station.StationId);

            var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

            var minutesAlreadyDisplayed = 0;

            // build id of div containing the UI elements of the programs for the current station
            var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
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
                    var width = (durationInMinutes / 30) * $scope.widthOfThirtyMinutes;
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

    }

    $scope.name = 'Channel Guide';
    console.log($scope.name + " screen displayed");

    $scope.getStationsPromise = null;
    $scope.getEpgDataPromise = null;

    $scope.stations = [];
    $scope.retrieveStations();

    // initialize epg data
    $scope.numDaysEpgData = 3;
    $scope.retrieveEpgData();

    // from view
    $scope.channelGuideDisplayStartDateTime = null;
    $scope.channelGuideDisplayEndDateTime = null;
    $scope.channelGuideDisplayCurrentDateTime = null;
    $scope.channelGuideDisplayCurrentEndDateTime = null;

    $scope._currentSelectedProgramButton = null;
    $scope._currentStationIndex = null;

    $scope.widthOfThirtyMinutes = 240;    // pixels
    $scope.channelGuideHoursDisplayed = 3;

    // display channel guide data
    if ($scope.getStationsPromise != null && $scope.getEpgDataPromise != null) {
        Promise.all([$scope.getStationsPromise, $scope.getEpgDataPromise]).then(function() {
            $scope.show();
        });
    }
}]);

