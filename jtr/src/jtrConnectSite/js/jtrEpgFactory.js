/**
 * Created by tedshaffer on 12/25/15.
 */
angular.module('jtr').factory('jtrEpgFactory', ['jtrServerService', function($jtrServerService){

    var service = {};

    var _epgProgramSchedule;
    var _epgProgramScheduleStartDateTime = Date.today().set({year: 2100, month: 0, day: 1, hour: 0});

    var _numDaysEpgData = 3;

    service.getEpgProgramSchedule = function() {
        return _epgProgramSchedule;
    };

    service.getEpgProgramScheduleStartDateTime = function() {
        return _epgProgramScheduleStartDateTime;
    };

    service.retrieveEpgData = function() {

        if (_epgProgramSchedule == undefined) {
            _epgProgramSchedule = {};

            return new Promise(function(resolve, reject) {

                var getEpgDataPromise = $jtrServerService.getEpgData();
                getEpgDataPromise.then(function(result) {

                    console.log("getEpgData success");

                    angular.forEach(result.data, function(sdProgram, index) {

                        // convert to local time zone
                        var localDate = new Date(sdProgram.AirDateTime);

                        // capture the earliest date in the epg data (in local time, so may be earlier than date passed to db)
                        if (localDate < _epgProgramScheduleStartDateTime) {
                            _epgProgramScheduleStartDateTime = localDate;
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
                        if (!(stationId in _epgProgramSchedule)) {
                            var programStationData = {};
                            programStationData.station = sdProgram.AtscMajor.toString() + "." + sdProgram.AtscMinor.toString();
                            programStationData.programList = [];
                            _epgProgramSchedule[stationId] = programStationData;
                        }

                        // append program to list of programs for this station
                        var programList = _epgProgramSchedule[stationId].programList;
                        programList.push(program);

                        // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
                        for (var stationId in _epgProgramSchedule) {
                            if (_epgProgramSchedule.hasOwnProperty(stationId)) {
                                var programStationData = _epgProgramSchedule[stationId];
                                var programList = programStationData.programList;
                                var programIndex = 0;

                                var programSlotIndices = [];

                                var lastProgram = null;

                                // 48 slots per day as each slot is 1/2 hour
                                for (var slotIndex = 0; slotIndex < 48 * _numDaysEpgData; slotIndex++) {

                                    var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;     // offset in minutes

                                    while (true) {

                                        // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                                        if (programIndex >= programList.length) {
                                            programSlotIndices.push(programIndex - 1);
                                            break;
                                        }

                                        var program = programList[programIndex];

                                        var programTimeOffsetSinceStartOfEPGData = msecToMinutes(program.date - _epgProgramScheduleStartDateTime);

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
                    resolve();
                }, function(reason) {
                    console.log("getEpgData failure");
                    reject();
                });
                return getEpgDataPromise;
            });
        }
        else {
            return new Promise(function(resolve, reject) {
                resolve();
            });
        }
    };

    return service;
}]);
