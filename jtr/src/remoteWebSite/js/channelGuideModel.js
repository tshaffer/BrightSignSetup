/**
 * Created by tedshaffer on 11/6/15.
 */
define(function () {

    var channelGuideModel = Backbone.Model.extend({

        msecToMinutes: function(msec) {
            return msec / 60000;
        },

        numDaysEpgData: 3,
        epgProgramSchedule: null,
        epgProgramScheduleStartDateTime: null,

        urlRoot : '/getEpg',

        defaults: {
            //title: '',
            //duration: '',
            //channel: '',
            //dateTime: '',
            //inputSource: 'tuner',
            //segmentRecordings: 0,
            //scheduledSeriesRecordingId: -1,
            //startTimeOffset: 0,
            //stopTimeOffset: 0
        },

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/getEpg";
            options.url = "http://192.168.2.8:8080/getEpg";
            Backbone.sync(method, model, options);
        },

        init: function() {
            //numDaysEpgData = 3;
            //epgProgramSchedule = null;
            //epgProgramScheduleStartDateTime = null;
        },

        retrieveEpgData: function() {

            var self = this;

            // initialize epg data
            this.epgProgramSchedule = {};
            this.epgProgramScheduleStartDateTime = Date.today().set({year: 2100, month: 0, day: 1, hour: 0});

            // retrieve data from db starting on today's date
            var epgStartDate = new Date().toString("yyyy-MM-dd");

            this.fetch({
                data: $.param({startDate: epgStartDate}),
                success: function (model, response, options) {
                    // JOEL-HELP! - self is window at this point - thank goodness model was in the callback!
                    console.log("epg data load was successful");

                    // self.channelGuideModel.attributes is an array of objects
                    // each object includes the following attributes
                    //      AirDateTime
                    //      AtscMajor
                    //      AtscMinor
                    //      CastMembers
                    //      Duration
                    //      EndDateTime
                    //      EpisodeTitle
                    //      LongDescription
                    //      Movie stuff
                    //      NewShow
                    //      OriginalAirDate
                    //      ...
                    //      StationId
                    //      Title
                    //      1033 entries in the array

                    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX getEpg success ************************************");

                    // for each station, generate an ordered list (by airDateTime) of all shows in the current epg data
                    self = model;
                    $.each(self.attributes, function (index, sdProgram) {

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

                    // MODEL OR VIEW?

                    // generate data for each time slot in the schedule - indicator of the first program to display at any given time slot
                    for (var stationId in self.epgProgramSchedule) {
                        if (self.epgProgramSchedule.hasOwnProperty(stationId)) {
                            var programStationData = self.epgProgramSchedule[stationId];
                            var programList = programStationData.programList;
                            var programIndex = 0;

                            var programSlotIndices = [];

                            var lastProgram = null;

                            // 48 slots per day as each slot is 1/2 hour
                            for (var slotIndex = 0; slotIndex < 48 * self.numDaysEpgData; slotIndex++) {

                                var slotTimeOffsetSinceStartOfEpgData = slotIndex * 30;     // offset in minutes

                                while (true) {

                                    // check for the case where we're at the end of the list of programs - occurs when the last show in the schedule is > 30 minutes
                                    if (programIndex >= programList.length) {
                                        programSlotIndices.push(programIndex - 1);
                                        break;
                                    }

                                    var program = programList[programIndex];

                                    var programTimeOffsetSinceStartOfEPGData = self.msecToMinutes(program.date - self.epgProgramScheduleStartDateTime);

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

                    // resolve promise here
                },
                error: function () {
                    console.log('There was some error in loading and processing the epg');
                }
            });
        }
    });
    return channelGuideModel;
});
