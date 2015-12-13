var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function ($routeProvider) {

    $routeProvider

    .when('/', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/recordings', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/channelGuide', {
        templateUrl: 'screens/channelGuide.html',
        controller: 'channelGuideController'
    })

    .when('/scheduledRecordings', {
        templateUrl: 'screens/scheduledRecordings.html',
        controller: 'scheduledRecordingsController'
    })

    .when('/manualRecord', {
        templateUrl: 'screens/manualRecord.html',
        controller: 'manualRecordController'
    })

    .when('/recordNow', {
        templateUrl: 'screens/recordNow.html',
        controller: 'recordNowController'
    })

    .when('/settings', {
        templateUrl: 'screens/settings.html',
        controller: 'settingsController'
    })
}]);

myApp.controller('FooterCtrl', ['$scope', '$log', function($scope, $log) {

    $scope.invokeHome = function() {
        console.log("home invoked");
    }

    $scope.invokeTrickMode = function(trickMode) {
        console.log("trickMode invoked: " + trickMode);
    };

    $scope.trickModes = [

        { command: "record", font: "glyphicon-record" },
        { command: "stop", font: "glyphicon-stop" },
        { command: "rewind", font: "glyphicon-backward" },
        { command: "instantReplay", font: "glyphicon-step-backward" },
        { command: "pause", font: "glyphicon-pause" },
        { command: "play", font: "glyphicon-play" },
        { command: "quickSkip", font: "glyphicon-step-forward" },
        { command: "fastForward", font: "glyphicon-forward" }
    ];

}]);

myApp.controller('recordingsController', ['$scope', '$log', '$http', function($scope, $log, $http) {

    $scope.getRecordings = function() {

        var baseURL= "http://192.168.0.111:8080/";
        var aUrl = baseURL + "getRecordings";

        var promise = $http.get(aUrl, {});

        return promise;
    };

    $scope.browserCommand = function(commandData) {

        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "browserCommand";

        var promise = $http.get(url, {
            params: commandData
        });

        return promise;
    }


    $scope.playRecordedShow = function(id) {
        console.log("playRecordedShow: " + id);

        var commandData = { "command": "playRecordedShow", "recordingId": id };
        var promise = $scope.browserCommand(commandData);
        promise.then(function() {
            console.log("browserCommand successfully sent");
        })
    }

    $scope.deleteRecordedShow = function(id) {
        console.log("deleteRecordedShow: " + id);
    }

    $scope.repeatRecordedShow = function(id) {
        console.log("repeatRecordedShow: " + id);
    }

    $scope.streamRecordedShow = function(id) {
        console.log("streamRecordedShow: " + id);
    }

    $scope.infoRecordedShow = function(id) {
        console.log("infoRecordedShow: " + id);
    }

    console.log($scope.name + " screen displayed");

    $scope.name = 'Recordings';
    $scope.recordings = [];

    promise = $scope.getRecordings();
    promise.then(function(result) {
        console.log("getRecordings success");

        // recordings are in result.data.recordings
        console.log("number of recordings is: " +  result.data.recordings.length);

        $scope.recordings = [];

        //for (recording of result.data.recordings)
        for (var i = 0; i < result.data.recordings.length; i++) {
            var jtrRecording = result.data.recordings[i];

            recording = {};
            recording.duration = jtrRecording.Duration;
            recording.fileName = jtrRecording.FileName;
            recording.hlsSegmentationComplete = jtrRecording.HLSSegmentationComplete;
            recording.hlsUrl = jtrRecording.HLSUrl;
            recording.lastViewedPosition = jtrRecording.LastViewedPosition;
            recording.recordingId = jtrRecording.RecordingId;
            recording.startDateTime = jtrRecording.StartDateTime;
            recording.title = jtrRecording.Title;
            recording.transcodeComplete = jtrRecording.TranscodeComplete;
            recording.path = jtrRecording.path;

// implement the following in filters?

            // IDs
            var recordingIdStr = recording.recordingId.toString();
            recording.playRecordingId = "recording" + recordingIdStr;
            recording.deleteRecordingId = "delete" + recordingIdStr;
            recording.repeatRecordingId = "repeat" + recordingIdStr;
            recording.streamRecordingId = "stream" + recordingIdStr;
            recording.infoRecordingId = "info" + recordingIdStr;

            // RECORDING DATE
            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var dt = recording.startDateTime;
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
            recording.startDateTime = formattedDayDate;

            // POSITION
            var lastViewedPositionInMinutes = Math.floor(recording.lastViewedPosition / 60);
            recording.position = lastViewedPositionInMinutes.toString() + " of " + recording.duration.toString() + " minutes";

            $scope.recordings.push(recording);
        }

        return;
    }, function(reason) {
        console.log("getRecordings failure");
    });
}]);

myApp.controller('channelGuideController', ['$scope', '$log', '$routeParams', '$http', function($scope, $log, $routeParams, $http) {

    $scope.getStations = function() {
        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "getStations";

        var epgStartDate = new Date().toString("yyyy-MM-dd");

        $scope.getStationsPromise = $http.get(url, {});
    };

    $scope.retrieveStations = function() {
        $scope.getStations();
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

    $scope.getEpgData = function() {

        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "getEpg";

        var epgStartDate = new Date().toString("yyyy-MM-dd");

        $scope.getEpgDataPromise = $http.get(url, {
            params: { startDate: epgStartDate }
        });
    };

    $scope.retrieveEpgData = function() {
        $scope.epgProgramSchedule = {};
        $scope.epgProgramScheduleStartDateTime = Date.today().set({year: 2100, month: 0, day: 1, hour: 0});

        $scope.getEpgData();
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

myApp.controller('scheduledRecordingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Scheduled Recordings';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('manualRecordController', ['$scope', '$log', '$routeParams', '$http', function($scope, $log, $routeParams, $http) {

    $scope.showChannel = function() {
        return $scope.inputSource == "tuner";
    }

    $scope.getRecordingTitle = function (titleId, dateObj, inputSource, channel) {

        var title = $scope.title;
        if (!title) {
            title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
            if ($scope.inputSource == "tuner") {
                title += " Channel " + channel;
            } else if ($scope.inputSource == "tivo") {
                title += " Tivo";
            } else {
                title += " Roku";
            }
        }

        return title;
    },


    $scope.invokeManualRecord = function() {

        console.log("invokeManualRecord");
        console.log("Title: " + $scope.title);
        console.log("Duration: " + $scope.duration);
        console.log("Date: " + $scope.date);
        console.log("Time: " + $scope.time);
        console.log("Input source: " + $scope.inputSource);
        console.log("Channel: " + $scope.channel);

        var date = $scope.date;
        var time = $scope.time;

        date.clearTime();
        var dateObj = date.set({
            millisecond: 0,
            second: 0,
            minute: time.getMinutes(),
            hour: time.getHours()
        });

        // check to see if recording is in the past
        var dtEndOfRecording = new Date(dateObj).addMinutes($scope.duration);
        var now = new Date();

        var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
        if (millisecondsUntilEndOfRecording < 0) {
            alert("Recording time is in the past - change the date/time and try again.");
        }

        $scope.manualRecordingParameters = {}
        $scope.manualRecordingParameters.title = $scope.getRecordingTitle("#manualRecordTitle", dateObj, $scope.inputSource, $scope.channel);
        $scope.manualRecordingParameters.dateTime = dateObj;
        $scope.manualRecordingParameters.duration = $scope.duration;
        $scope.manualRecordingParameters.inputSource = $scope.inputSource;
        $scope.manualRecordingParameters.channel = $scope.channel;

        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "manualRecording";

        var promise = $http.post(url, {
            params: $scope.manualRecordingParameters
        });
    };

    $scope.name = 'Manual Record';
    console.log($scope.name + " screen displayed");

    $scope.title = "";
    $scope.duration = "";

    date = new Date();
    $scope.date = date;
    $scope.time = new Date(2015, 0, 1, date.getHours(), date.getMinutes(), 0);

    $scope.inputSource = "tuner";
    $scope.channel = "5";

    $("#manualRecordTitle").focus();

}]);

myApp.controller('recordNowController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('settingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

}]);

