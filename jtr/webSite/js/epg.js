var schedulesDirectToken;

var numDaysEpgData = 2;

var stations = [];
var scheduleValidityByStationDate = {};     // schedule information for each station/date 
var scheduleModificationData;

var programsValidity = {};
var jtrProgramsToRetrieve = {};

var programIdsToRetrieve = [];
var programIdsNeedingInserts = {};
var programIdsNeedingUpdates = {};

var stationIdDates = [];
var stationIdDatesNeedingInserts = {};
var stationIdDatesNeedingUpdates = {};

function initializeEpgData() {

     getSchedulesDirectToken(retrieveEpgData);
}


function getSchedulesDirectToken(nextFunction) {

    // cors tutorial
    //http://www.html5rocks.com/en/tutorials/cors/

    $(document).ajaxError(function () {
        console.log("Triggered ajaxError handler.");
    });
    postData = {}

    postData.username = "jtrDev";
    postData.password = "3bacdc30b9598fb498dfefc00b2f2ad52150eef4";
    var postDataStr = JSON.stringify(postData);

    var url = "https://json.schedulesdirect.org/20141201/token";

    $.post(url, postDataStr, function (data) {
        console.log("returned from token (get from schedules direct) post");
        console.log(JSON.stringify(data, null, 4));
        //console.log(retVal);
        //console.log(data);
        //{"code":0,"message":"OK","serverID":"20141201.web.1","token":"5801004984e3ccb3f9289232b745f797"}
        console.log("code: " + data.code);
        console.log("message: " + data.message);
        console.log("serverID: " + data.serverID);
        console.log("token: " + data.token);

        schedulesDirectToken = data.token;

        if (nextFunction != null) {
            nextFunction();
        }
    });
}


function retrieveEpgData() {

    // retrieve epg data for all stations and 'n' days
    // at end of update, db should be up to date and epg data should be in memory

    console.log("retrieveEpgData() invoked");

    // step 1 retrieve users stations
    getStations(retrieveEpgDataStep2);
}


function getStations(nextFunction) {

    console.log("getStations() invoked");

    var url = baseURL + "getStations";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
        .done(function (result) {
            console.log("successful return from getStations");
            stations = result.stations;

            if (nextFunction != null) {
                nextFunction();
            }
        })
        .fail(function () {
            alert("getStations failure");
        })
        .always(function () {
            //alert("getStations complete");
        });
}


function retrieveEpgDataStep2() {

    var stationIds = [];
    var dates = [];

    // step 2
    // build initial scheduleValidityByStationDate. That is, add keys, set values to initial /  default settings
    // one entry for each station, date combination
    $.each(stations, function (index, station) {

        var startDate = new Date();

        for (i = 0; i < numDaysEpgData; i++) {
            var date = new Date(startDate);
            date.setDate(date.getDate() + i);
            var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());

            var stationDate = station.StationId + "-" + dateVal;

            var scheduleValidity = {};
            scheduleValidity.stationId = station.StationId;
            scheduleValidity.scheduleDate = dateVal;
            scheduleValidity.modifiedDate = "";
            scheduleValidity.md5 = "";
            scheduleValidity.status = "noData";
            scheduleValidityByStationDate[stationDate] = scheduleValidity;

            if (stationIds.length == 0) {
                dates.push(dateVal);
            }
        }

        stationIds.push(station.StationId);
    });

    // dump initialized data structure
    //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

    // retrieve last fetched station schedules from db
    var url = baseURL + "getStationSchedulesForSingleDay";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
    .done(function (result) {
        console.log("successful return from getStationSchedulesForSingleDay");

        // dump StationSchedulesForSingleDay table from db
        //console.log(JSON.stringify(result, null, 4));

        // fill in scheduleValidityByStationDate with appropriate data from db
// JTR TODO
// change return value so that I dont have to use the nonsense on the next line.
        $.each(result.stationschedulesforsingleday, function (index, jtrStationScheduleForSingleDay) {
            var stationDate = jtrStationScheduleForSingleDay.StationId + "-" + jtrStationScheduleForSingleDay.ScheduleDate;

            // is the station/date retrieved from db in the initialized data structure?
            // JTR TODO - if not, perhaps that implies that the information can be removed from the database
            // it won't be for dates now in the past
            if (stationDate in scheduleValidityByStationDate) {
                var scheduleValidity = scheduleValidityByStationDate[stationDate];
                scheduleValidity.modifiedDate = jtrStationScheduleForSingleDay.ModifiedDate;
                scheduleValidity.md5 = jtrStationScheduleForSingleDay.MD5;
                scheduleValidity.status = "dataCurrent";
            }
        });

        // dump StationSchedulesForSingleDay as updated based on db data
        //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

        // fetch data from Schedules Direct that will indicate the last changed date/information for relevant station/dates.
        getSchedulesDirectScheduleModificationData(stationIds, dates, retrieveEpgDataStep3);
    })
    .fail(function () {
        alert("getStationSchedulesForSingleDay failure");
    })
    .always(function () {
        alert("getStationSchedulesForSingleDay complete");
    });

}


function getSchedulesDirectScheduleModificationData(stationIds, dates, nextFunction) {

    console.log("getSchedulesDirectScheduleModificationData");

    // JTR TODO
    // same as in getSchedulesDirectProgramSchedules - make common? is this still true?
    var postData = [];

    $.each(stationIds, function (index, stationId) {

        var stationData = {};

        stationData.stationID = stationId;

        stationData.date = [];
        for (dateIndex in dates) {
            stationData.date.push(dates[dateIndex]);
        }

        postData.push(stationData);
    });
    var postDataStr = JSON.stringify(postData);

    var url = "https://json.schedulesdirect.org/20141201/schedules/md5";

    console.log("getSchedulesDirectScheduleModificationData - invoke post");

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
        .done(function (result) {
            console.log("successful return in getSchedulesDirectScheduleModificationData");

            // dump schedule modification data results from server call
            //console.log(JSON.stringify(result, null, 4));

            scheduleModificationData = result;

            if (nextFunction != null) {
                nextFunction();
            }
        })
        .fail(function () {
            alert("getSchedulesDirectScheduleModificationData failure");
        })
        .always(function () {
            alert("getSchedulesDirectScheduleModificationData complete");
        });
}


function retrieveEpgDataStep3() {

    // for each station/date combination, if it already has data, see if it is current
    $.each(scheduleValidityByStationDate, function (index, scheduleValidity) {
        if (scheduleValidity.status == "dataCurrent") {
            // find matching record in scheduleModificationData
            var stationId = scheduleValidity.stationId;
            var scheduleDate = scheduleValidity.scheduleDate;
            if (stationId in scheduleModificationData) {
                var scheduleModifiedDataForStation = scheduleModificationData[stationId];
                //console.log(JSON.stringify(scheduleModifiedDataForStation, null, 4));
                if (scheduleDate in scheduleModifiedDataForStation) {
                    var scheduleModifiedDataForStationDate = scheduleModifiedDataForStation[scheduleDate];
                    //console.log(JSON.stringify(scheduleModifiedDataForStationDate, null, 4));
                    if (scheduleModifiedDataForStationDate.md5 != scheduleValidity.md5) {
                        scheduleValidity.status = "dataObsolete";
                    }
                    // JTR TODO - else, also check modified date??
                }
            }
            else {
                console.log("WARNING!!!!!!!!!!!!!!!! - scheduleModificationData missing record for " + stationId + ", " + scheduleDate);
            }
        }
    });

    // dump StationSchedulesForSingleDay after getting updated using last modified data from Schedules Direct
    //console.log(JSON.stringify(scheduleValidityByStationDate, null, 4));

    // at this point, the system knows which station/date records need updates from the service - scheduleValidityByStationDate
    // it knows which station/dates have no data vs. which ones need to have their data updated

    // build data structure to pass to SchedulesDirect to retrieve latest stationId/date(s) information
    // at the same time, capture which stationId/date combinations need to be inserted in the db vs updated in the db
    //var stationIdDatesNeedingInserts = {};
    //var stationIdDatesNeedingUpdates = {};
    var stationIdDatesToRetrieve = [];
    var lastStationId = "";
    var stationDates = {};

    // JTR TODO - not all that happy about this code. better way?
    $.each(scheduleValidityByStationDate, function (index, scheduleValidity) {
        if (scheduleValidity.status != "dataCurrent") {
            var stationId = scheduleValidity.stationId;
            var scheduleDate = scheduleValidity.scheduleDate;
            var stationDateKey = stationId + "-" + scheduleDate;
            if (scheduleValidity.status == "noData") {
                stationIdDatesNeedingInserts[stationDateKey] = true;
            }
            else {
                stationIdDatesNeedingUpdates[stationDateKey] = true;
            }

            if (stationId != lastStationId) {

                // capture data before moving to new stationId
                if (lastStationId != "") {
                    stationIdDatesToRetrieve.push(stationDates);
                }
                lastStationId = stationId;

                stationDates = {};
                stationDates.stationID = stationId;
                stationDates.date = [];
            }
            stationDates.date.push(scheduleValidity.scheduleDate);
        }
    });

    // capture last stationId/date combination if needed
    if (lastStationId != "") {
        stationIdDatesToRetrieve.push(stationDates);
    }


    // dump list of stationId/date(s) combinations to retrieve and then add/replace in db
    //console.log(JSON.stringify(stationIdDatesToRetrieve, null, 4));
    //console.log(JSON.stringify(stationIdDatesNeedingInserts, null, 4));
    //console.log(JSON.stringify(stationIdDatesNeedingUpdates, null, 4));

    if (stationIdDatesToRetrieve.length == 0) {
        console.log("All data up to date, return");
        return;
    }
    // at this point, there is a list of stationId/date(s) to retrieve from server as well as which to insert in the db vs. update in the db
    getSchedulesDirectProgramSchedules(stationIdDatesToRetrieve, stationIdDatesNeedingInserts, stationIdDatesNeedingUpdates, retrieveEpgDataStep4);
}


function getSchedulesDirectProgramSchedules(stationIdDatesToRetrieve, stationIdDatesNeedingInserts, stationIdDatesNeedingUpdates, nextFunction) {

    console.log("getSchedulesDirectProgramSchedules");

    var postDataStr = JSON.stringify(stationIdDatesToRetrieve);

    var url = "https://json.schedulesdirect.org/20141201/schedules";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
        .done(function (result) {
            console.log("successful return from json.schedulesdirect.org/20141201/schedules");

            // dump list of updated station/dates from server
            //console.log(JSON.stringify(result, null, 4));

            var jtrStationSchedulesForSingleDayToInsert = [];
            var jtrStationSchedulesForSingleDayToUpdate = [];

            var jtrProgramsForStations = [];
            jtrProgramsToRetrieve = {};

            var jtrStationDatesToReplace = [];

            // JTR TODO - convert to $.each
            for (index in result) {
                //console.log("index=" + index);
                var jtrStationScheduleForSingleDay = {};
                var stationScheduleForSingleDay = result[index];

                // check to see whether or not there is valid data
                if (typeof stationScheduleForSingleDay.code != 'undefined' && stationScheduleForSingleDay.code != 0) {
                    continue;
                }

                // capture data unique to the station/date (independent of programs on for that station/date)
                // this data will help determine when station/date data (programs) needs updating in the future
                jtrStationScheduleForSingleDay.stationId = stationScheduleForSingleDay.stationID;
                jtrStationScheduleForSingleDay.scheduleDate = stationScheduleForSingleDay.metadata.startDate;
                jtrStationScheduleForSingleDay.modifiedDate = stationScheduleForSingleDay.metadata.modified;
                jtrStationScheduleForSingleDay.md5 = stationScheduleForSingleDay.metadata.md5;

                // for this stationDate, determine whether to perform update or insert
                var key = jtrStationScheduleForSingleDay.stationId + "-" + jtrStationScheduleForSingleDay.scheduleDate;
                if (key in stationIdDatesNeedingInserts) {
                    jtrStationSchedulesForSingleDayToInsert.push(jtrStationScheduleForSingleDay);
                }
                else if (key in stationIdDatesNeedingUpdates) {
                    jtrStationSchedulesForSingleDayToUpdate.push(jtrStationScheduleForSingleDay);
                }
                else {
                    console.log("WARNING!!!!!!!!!!!!!!!!!!!!!!!!!! - key not found in either insert or updates data structure");
                    // JTR TODO - just skip this record?
                    return;
                }

                // capture the list of station/dates combinations
                jtrStationDateToReplace = {};
                jtrStationDateToReplace.stationId = jtrStationScheduleForSingleDay.stationId;
                jtrStationDateToReplace.scheduleDate = jtrStationScheduleForSingleDay.scheduleDate;
                jtrStationDatesToReplace.push(jtrStationDateToReplace);

                // JTR TODO - convert to $.each
                // capture all the programs for the station/date.
                // this is supposedly only the program data relevant for this showing. a programId is provided to get the detailed program information
                // common to all showings of the program
                //console.log("stationScheduleForSingleDay.programs.length=" + stationScheduleForSingleDay.programs.length);
                for (programIndex in stationScheduleForSingleDay.programs) {
                    var program = stationScheduleForSingleDay.programs[programIndex];
                    var jtrProgramForStation = {};
                    jtrProgramForStation.stationId = jtrStationScheduleForSingleDay.stationId;
                    jtrProgramForStation.scheduleDate = jtrStationScheduleForSingleDay.scheduleDate;
                    jtrProgramForStation.programId = program.programID;
                    jtrProgramForStation.airDateTime = program.airDateTime;
                    var endDateTime = new Date(program.airDateTime);
                    endDateTime.setSeconds(endDateTime.getSeconds() + program.duration);
                    jtrProgramForStation.endDateTime = endDateTime.toISOString();
                    jtrProgramForStation.duration = program.duration / 60;      // convert from seconds to minutes

                    var newShow = boolValueIfMetadataExists(program, "new");
                    if (newShow) {
                        jtrProgramForStation.newShow = 1;
                    }
                    else {
                        jtrProgramForStation.newShow = 0;
                    }

                    jtrProgramForStation.md5 = program.md5;
                    jtrProgramsForStations.push(jtrProgramForStation);

                    // JTR TODO - is it necessary to retrieve all these programs or might some of the data already be stored and valid?
                    jtrProgramsToRetrieve[program.programID] = program;     // note - the duration member is still in seconds - is that a problem?
                }
            }

            // insert / update the stationDate schedules in the db
            var jtrStationSchedulesForSingleDayToInsertStr = JSON.stringify(jtrStationSchedulesForSingleDayToInsert);
            var jtrStationSchedulesForSingleDayToUpdateStr = JSON.stringify(jtrStationSchedulesForSingleDayToUpdate);
            bsMessage.PostBSMessage({ command: "addDBStationSchedulesForSingleDay", "schedulesToInsert": jtrStationSchedulesForSingleDayToInsertStr, "schedulesToUpdate": jtrStationSchedulesForSingleDayToUpdateStr });

            //console.log(JSON.stringify(jtrProgramsForStations, null, 4));

            // next step is to update the programs for the station/date(s)
            // that will be done by first eliminating all the current station/date data for all updated station/date(s),
            // followed by inserting all the new information
            var jtrStationDatesToReplaceStr = JSON.stringify(jtrStationDatesToReplace);
            var jtrProgramsForStationsStr = JSON.stringify(jtrProgramsForStations);
            bsMessage.PostBSMessage({ command: "addDBProgramsForStations", "station_dates": jtrStationDatesToReplaceStr, "programs": jtrProgramsForStationsStr });

            if (nextFunction != null) {
                nextFunction();
            }
        })
        .fail(function () {
            alert("getSchedulesDirectProgramSchedules failure");
        })
        .always(function () {
            alert("getSchedulesDirectProgramSchedules complete");
        });

}


function retrieveEpgDataStep4() {

    GetProgramsFromDB(null);
}


function GetProgramsFromDB(nextFunction) {

    // initialize data structure describing programs to retrieve
    // programs were indicated by /Schedules return data which contains the md5 for the programs
    var programsValidity = {};
    for (var programId in jtrProgramsToRetrieve) {
        if (jtrProgramsToRetrieve.hasOwnProperty(programId)) {
            var jtrProgramToRetrieve = jtrProgramsToRetrieve[programId];
            programValidity = {};
            programValidity.md5 = jtrProgramToRetrieve.md5;
            programValidity.status = "noData";
            programsValidity[programId] = programValidity;
        }
    }

    // dump initialized data structure for programs to retrieve from SchedulesDirect
    //console.log(JSON.stringify(programsValidity, null, 4));

    // retrieve programs from db
    var url = baseURL + "getPrograms";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    })
        .done(function (result) {
            console.log("successful return from getPrograms");

            // dump programs retrieved from db
            //console.log(JSON.stringify(result, null, 4));
            console.log("number of programs in database is " + result.programs.length);
            console.log("number of programs in out of date station/dates is " + Object.keys(programsValidity).length);

            // move these programs from the db into an associative array
            var programsInDB = {};
            $.each(result.programs, function (index, program) {
                programsInDB[program.ProgramId] = program;
            });

            // determine which programs need to be retrieved from SchedulesDirect and for each, determine if it's an insert or update in the db by comparing to existing data in db

            var numMissing = 0;
            var numObsolete = 0;
            var numCurrent = 0;
            for (var programId in programsValidity) {
                if (programsValidity.hasOwnProperty(programId)) {

                    var programToRetrieve = programsValidity[programId];

                    if (programId in programsInDB) {
                        var programInDB = programsInDB[programId];
                        if (programInDB.MD5 == programToRetrieve.md5) {

                            programToRetrieve.status = "dataCurrent";
                            numCurrent++;
                        }
                        else {
                            programIdsToRetrieve.push(programId);
                            programIdsNeedingUpdates[programId] = programId;

                            programToRetrieve.status = "dataObsolete";
                            numObsolete++;
                        }
                    }
                    else {
                        programIdsToRetrieve.push(programId);
                        programIdsNeedingInserts[programId] = programId;

                        programToRetrieve.status = "noData";
                        numMissing++;
                    }
                }
            }

            // dump updated programValidity
            //console.log(JSON.stringify(programsValidity, null, 4));

            console.log("number of programs current=" + numCurrent);
            console.log("number of programs obsolete=" + numObsolete);
            console.log("number of programs missing=" + numMissing);

            // dump ids of programs to retrieve from SchedulesDirect
            //console.log("programs to retrieve");
            //console.log(JSON.stringify(programIdsToRetrieve, null, 4));

            // dump ids of programs to insert or update in the database
            //console.log("programs to update");
            //console.log(JSON.stringify(programIdsNeedingUpdates, null, 4));
            //console.log("programs to insert");
            //console.log(JSON.stringify(programIdsNeedingInserts, null, 4));

            getSchedulesDirectPrograms(nextFunction);
        })
        .fail(function () {
            alert("getPrograms failure");
        })
        .always(function () {
            alert("getPrograms complete");
        });

}


function getSchedulesDirectPrograms(nextFunction) {

    console.log("getSchedulesDirectPrograms");

    var postDataStr = JSON.stringify(programIdsToRetrieve);

    var url = "https://json.schedulesdirect.org/20141201/programs";

    var jqxhr = $.ajax({
        type: "POST",
        url: url,
        data: postDataStr,
        dataType: "json",
        headers: { "token": schedulesDirectToken }
    })
        .done(function (result) {
            console.log("done in getSchedulesDirectPrograms");
            // dump list of programs retrieved from SchedulesDirect
            //console.log(JSON.stringify(result, null, 4));

            // determine which programs get added to db vs. which are already in db and need to get updated
            var jtrProgramsToInsert = [];
            var jtrProgramsToUpdate = [];

            var jtrCastMembers = [];

            $.each(result, function (index, program) {

                var jtrProgram = {};
                jtrProgram.programId = program.programID;
                jtrProgram.title = program.titles[0].title120;
                jtrProgram.episodeTitle = valueIfMetadataExists(program, "episodeTitle150");
                jtrProgram.shortDescription = "";
                jtrProgram.longDescription = "";
                if ("descriptions" in program) {
                    if ("description100" in program.descriptions) {
                        jtrProgram.shortDescription = program.descriptions.description100[0].description;
                    }
                    if ("description1000" in program.descriptions) {
                        jtrProgram.longDescription = program.descriptions.description1000[0].description;
                    }
                }

                //if ("eventDetails" in program) {
                //    debugger;
                //}

                if ("genres" in program) {
                    $.each(program.genres, function (genreIndex, genre) {
                        //console.log("genre is " + genre);
                    });
                }

                jtrProgram.showType = valueIfMetadataExists(program, "showType");

                jtrProgram.originalAirDate = valueIfMetadataExists(program, "originalAirDate");

                jtrProgram.seasonEpisode = "";
                if ("metadata" in program) {
                    if (typeof program.metadata[0] == "object") {
                        var se = program.metadata[0];
                        for (var key in se) {
                            if (se.hasOwnProperty(key)) {
                                if (("season" in se[key]) && ("episode" in se[key])) {
                                    jtrProgram.seasonEpisode = "Season " + se[key].season.toString() + ", " + "Episode " + se[key].episode.toString();
                                }
                            }
                        }
                    }
                }

                jtrProgram.md5 = valueIfMetadataExists(program, "md5");

                if ("cast" in program) {
                    $.each(program.cast, function (castIndex, castItem) {
                        var castMember = {};
                        castMember.programId = program.programID;
                        // castMember.name = castItem.name;
                        castMember.name = castItem.billingOrder + castItem.name;
                        castMember.billingOrder = castItem.billingOrder;
                        jtrCastMembers.push(castMember);
                    });
                }
                else
                {
                    var castMember = {};
                    castMember.programId = program.programID;
                    castMember.name = "01none";
                    castMember.billingOrder = "01";
                    jtrCastMembers.push(castMember);
                }

                jtrProgram.movieYear = "";
                jtrProgram.movieRating = "";
                jtrProgram.movieMinRating = "";
                jtrProgram.movieMaxRating = "";
                jtrProgram.movieRatingIncrement = "";

                if ("movie" in program) {
                    if ("year" in program.movie) {
                        jtrProgram.movieYear = program.movie.year;
                    }
                    if ("duration" in program.movie) {
                        var movieDuration = program.movie.duration;             // number
                    }
                    if ("qualityRating" in program.movie) {
                        var qualityRating = program.movie.qualityRating[0];
                        if ("ratingsBody" in qualityRating) {
                            var ratingsBody = qualityRating.ratingsBody;
                        }
                        if ("rating" in qualityRating) {
                            jtrProgram.movieRating = qualityRating.rating;      // string
                        }
                        if ("minRating" in qualityRating) {
                            jtrProgram.movieMinRating = qualityRating.minRating;     // string
                        }
                        if ("maxRating" in qualityRating) {
                            jtrProgram.movieMaxRating = qualityRating.maxRating;     // string
                        }
                        if ("increment" in qualityRating) {
                            jtrProgram.movieRatingIncrement = qualityRating.increment;     // string
                        }
                    }
                }

                if (program.programID in programIdsNeedingInserts) {
                    jtrProgramsToInsert.push(jtrProgram);
                }
                else if (program.programID in programIdsNeedingUpdates) {
                    jtrProgramsToUpdate.push(jtrProgram);
                }
                else {
                    console.log("WARNING: retrieved program unaccounted for");
                    return;
                }
            });

            // dump list of programs to insert / update in db
            //console.log("programs to insert");
            //console.log(JSON.stringify(jtrProgramsToInsert, null, 4));
            //console.log("programs to update");
            //console.log(JSON.stringify(jtrProgramsToUpdate, null, 4));

            var jtrProgramsToInsertStr = JSON.stringify(jtrProgramsToInsert);
            var jtrProgramsToUpdateStr = JSON.stringify(jtrProgramsToUpdate);
            bsMessage.PostBSMessage({ command: "addDBPrograms", "programsToInsert": jtrProgramsToInsertStr, "programsToUpdate": jtrProgramsToUpdateStr });

            // delete all cast records associated with programs getting updated; then add all cast member records
            var jtrCastMembersStr = JSON.stringify(jtrCastMembers);
            bsMessage.PostBSMessage({ command: "addDBProgramCast", "castMembers": jtrCastMembersStr, "programCastsToDelete": jtrProgramsToUpdateStr });

            //if (nextFunction != null) {
            //    nextFunction();
            //}

            // save each stationId / date combination where schedules were added
            // this will be used to update the scheduledRecordings table
            stationIdDates = [];
            for (var stationIdDateNeedingInsert in stationIdDatesNeedingInserts) {
                if (stationIdDatesNeedingInserts.hasOwnProperty(stationIdDateNeedingInsert)) {
                    var parts = stationIdDateNeedingInsert.split("-");

                    var atscMajor = "";
                    var atscMinor = "";
                    var date = parts[1] + "-" + parts[2] + "-" + parts[3];

                    for (var i = 0; i < stations.length; i++) {
                        var station = stations[i];
                        if (station.StationId == parts[0]) {
                            atscMajor = station.AtscMajor;
                            atscMinor = station.AtscMinor;
                        }
                    }

                    var stationDate = {};
                    stationDate.atscMajor = atscMajor;
                    stationDate.atscMinor = atscMinor;
                    stationDate.date = date;
                    stationIdDates.push(stationDate);
                }
            }

            console.log("All DONE");

            bsMessage.PostBSMessage({ command: "epgUpdatesComplete" });
        })
        .fail(function () {
            alert("getSchedulesDirectPrograms failure");
        })
        .always(function () {
            alert("getSchedulesDirectPrograms complete");
        });
}


function updateScheduledRecordings() {

    // get series recordings
    var getScheduledSeriesRecordingsPromise = new Promise(function(resolve, reject) {

        var aUrl = baseURL + "getScheduledSeriesRecordings";

        $.get(
            aUrl
        ).then(function (result) {
                resolve(result.scheduledrecordings);
            });
    });

    getScheduledSeriesRecordingsPromise.then(function(scheduledSeriesRecordings) {

        console.log("getScheduledSeriesRecordingsPromise resolved");

        var promises = [];

        $.each(scheduledSeriesRecordings, function (index, scheduledSeriesRecording) {

            // from recordingEngine.js: promises.push(new Promise(function(resolve, reject) {
            promises.push(new Promise(function(resolve, reject) {

                // for this scheduledSeriesRecording, see if there is any new schedule data for the station associated with this series recording
                var atsc = scheduledSeriesRecording.Channel.split("-");
                var atscMajor = atsc[0];
                var atscMinor = atsc[1];

                // linear search; only one will match - this is an area to improve
                for (var i = 0; i < stationIdDates.length; i++) {
                    var stationIdDate = stationIdDates[i];
                    if (atscMajor == stationIdDate.atscMajor && atscMinor == stationIdDate.atscMinor) {
                        // retrieves instances of this program on the appropriate date
                        var url = baseURL + "getEpgMatchingProgramsOnDate";
                        var getEpgMatchingProgramsDataOnDate = {
                            "date": stationIdDate.date,
                            "title": scheduledSeriesRecording.Title,
                            "atscMajor": atscMajor,
                            "atscMinor": atscMinor
                        };

                        $.get(url, getEpgMatchingProgramsDataOnDate)
                            .done(function (result) {
                                console.log("getEpgMatchingProgramsDataOnDate successfully received");

                                var seriesEpisodesFound = result.length;
                                var seriesEpisodesAdded = 0;

                                for (var j = 0; j < result.length; j++) {
                                    // make a copy of scheduledSeriesRecording to get a unique object
                                    var sdProgram = result[j];
                                    scheduledEpisode = {};
                                    scheduledEpisode.Channel = scheduledSeriesRecording.Channel;
                                    scheduledEpisode.DateTime = new Date(sdProgram.AirDateTime);
                                    scheduledEpisode.EndDateTime = new Date(sdProgram.EndDateTime);
                                    scheduledEpisode.Duration = sdProgram.Duration;
                                    scheduledEpisode.InputSource = scheduledSeriesRecording.InputSource;
                                    scheduledEpisode.RecordingBitRate = scheduledSeriesRecording.RecordingBitRate;
                                    scheduledEpisode.SegmentRecording = scheduledSeriesRecording.SegmentRecording;
                                    scheduledEpisode.ShowType = scheduledSeriesRecording.ShowType;
                                    scheduledEpisode.Title = scheduledSeriesRecording.Title;

                                    // add scheduledEpisode to scheduledRecordings
                                    aUrl = baseURL + "addScheduledRecording";
                                    var isoDateTime = scheduledEpisode.DateTime.toISOString();
                                    recordingData = {
                                        "dateTime": isoDateTime,
                                        "endDateTime": scheduledEpisode.EndDateTime,
                                        "title": scheduledEpisode.Title,
                                        "duration": scheduledEpisode.Duration,
                                        "inputSource": scheduledEpisode.InputSource,
                                        "channel": scheduledEpisode.Channel,
                                        "recordingBitRate": scheduledEpisode.RecordingBitRate,
                                        "segmentRecording": scheduledEpisode.SegmentRecording,
                                        "showType": scheduledEpisode.ShowType,
                                        "recordingType": "single"
                                    };
                                    $.get(aUrl, recordingData)
                                        .then(function (result) {
                                            seriesEpisodesAdded++;
                                            if (seriesEpisodesAdded == seriesEpisodesFound) {
                                                resolve();
                                            }
                                            consoleLog("addScheduledRecording successfully sent");
                                        }, function () {
                                            reject();
                                            consoleLog("addScheduledRecording failure");
                                        });
                                }
                            })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                debugger;
                                console.log("getEpgMatchingProgramsDataOnDate failure");
                            })
                            .always(function () {
                                //alert("recording transmission finished");
                            });
                    }
                }

            }));

            //promises[index].then(function() {
            //    console.log("resolved");
            //}, function() {
            //    console.log("error");
            //});

        });

        Promise.all(promises).then(function() {
            console.log("all promises completed");
            var event = {};
            event["EventType"] = "SCHEDULED_RECORDINGS_UPDATED";
            postMessage(event);
        });

    }, function() {
        console.log("error");
    });


}
// get last modified data for provided stationId/date combinations
// store result in scheduleModificationData; epg member variable



// following functions are currently unused in regular operation

function getSchedulesDirectStation(stations, atscMajor, atscMinor) {

    for (var key in stations) {
        if (stations.hasOwnProperty(key)) {
            var station = stations[key];
            //console.log(JSON.stringify(station, null, 4));
            if (station.atscMajor == atscMajor && station.atscMinor == atscMinor) {
                return station;
            }
        }
    }
}


function getSchedulesDirectLineupMappings(token, lineup) {

    var url = "https://json.schedulesdirect.org/20141201/lineups/" + lineup;

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectLineupMappings");
        //console.log(JSON.stringify(result, null, 4));

        var stations = {};
        for (mapIndex in result.map) {
            var stationMap = result.map[mapIndex];
            var station = {};
            station.stationId = stationMap.stationID;
            station.atscMajor = stationMap.atscMajor;
            station.atscMinor = stationMap.atscMinor;
            stations[station.stationId] = station;
        }
        for (stationIndex in result.stations) {
            var stationDescription = result.stations[stationIndex];
            //console.log(JSON.stringify(stationDescription, null, 4));
            var matchingStation = stations[stationDescription.stationID];
            matchingStation.name = stationDescription.name;
            matchingStation.callsign = stationDescription.callsign;
            //console.log(JSON.stringify(matchingStation, null, 4));
        }
        //for (var key in stations) {
        //    if (stations.hasOwnProperty(key))
        //        console.log(JSON.stringify(stations[key], null, 4));
        //}

        // get jtr stations
        //var channel2 = getSchedulesDirectStation(stations, 2, 1);
        //console.log(JSON.stringify(channel2, null, 4));
        //var channel4 = getSchedulesDirectStation(stations, 4, 1);
        //console.log(JSON.stringify(channel4, null, 4));
        //var channel5 = getSchedulesDirectStation(stations, 5, 1);
        //console.log(JSON.stringify(channel5, null, 4));
        //var channel7 = getSchedulesDirectStation(stations, 7, 1);
        //console.log(JSON.stringify(channel7, null, 4));
        //var channel91 = getSchedulesDirectStation(stations, 9, 1);
        //console.log(JSON.stringify(channel91, null, 4));
        //var channel92 = getSchedulesDirectStation(stations, 9, 2);
        //console.log(JSON.stringify(channel92, null, 4));
        //var channel93 = getSchedulesDirectStation(stations, 9, 3);
        //console.log(JSON.stringify(channel93, null, 4));
        //var channel11 = getSchedulesDirectStation(stations, 11, 1);
        //console.log(JSON.stringify(channel11, null, 4));
        //var channel36 = getSchedulesDirectStation(stations, 36, 1);
        //console.log(JSON.stringify(channel36, null, 4));
        //var channel44 = getSchedulesDirectStation(stations, 44, 1);
        //console.log(JSON.stringify(channel44, null, 4));

        var stations = [];
        //stations.push(ktvu);
        stations.push(channel2);

        var dates = [];
        dates.push("2015-06-21");
        dates.push("2015-06-22");

        // getSchedulesDirectProgramSchedules(token, stations, dates);
    })
    .fail(function () {
        alert("getSchedulesDirectLineupMappings failure");
    })
    .always(function () {
        alert("getSchedulesDirectLineupMappings complete");
    });
}


function getSchedulesDirectUsersLineups(token, desiredLineup) {
    var url = "https://json.schedulesdirect.org/20141201/lineups";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectUsersLineups");
        //console.log(JSON.stringify(result, null, 4));
        var lineup = parseScheduledDirectHeadends(result)
        //console.log("parseScheduledDirectHeadends returned lineup " + lineup);

        // ensure that desired lineup is subscribed to - if not add the new lineup (TBD)
        var lineupResults = result;
        for (lineUpIndex in lineupResults.lineups) {
            var lineup = lineupResults.lineups[lineUpIndex];
            if (lineup.lineup == desiredLineup) {
                console.log("found desired lineup");
                getSchedulesDirectLineupMappings(token, desiredLineup);
            }
        }
    })
    .fail(function () {
        alert("getSchedulesDirectUsersLineups failure");
    })
    .always(function () {
        alert("getSchedulesDirectUsersLineups complete");
    });
}


function parseScheduledDirectHeadends(headends) {

    for (var headendIndex in headends) {
        var headend = headends[headendIndex];
        if (headend.headend == "94022" && headend.transport == "Antenna" && headend.location == "94022") {
            var lineup = headend.lineups[0].lineup;
            return lineup;
        }
    }

    return "";
}


function getSchedulesDirectHeadends(token) {
    var url = "https://json.schedulesdirect.org/20141201/headends?country=USA&postalcode=94022";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        //console.log("done in getSchedulesDirectHeadends");
        //console.log(JSON.stringify(result, null, 4));
        var lineup = parseScheduledDirectHeadends(result)
        console.log("parseScheduledDirectHeadends returned lineup " + lineup);
        getSchedulesDirectUsersLineups(token, lineup);
    })
    .fail(function () {
        alert("getSchedulesDirectHeadends failure");
    })
    .always(function () {
        alert("getSchedulesDirectHeadends complete");
    });
}


function getSchedulesDirectStatus(token) {

    console.log("getSchedulesDirectStatus");

    var url = "https://json.schedulesdirect.org/20141201/status";

    var jqxhr = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        headers: { "token": token }
    })
    .done(function (result) {
        console.log("done in getSchedulesDirectStatus");
        console.log(JSON.stringify(result, null, 4));
        var systemStatus = result.systemStatus[0].status;
        console.log("status = " + systemStatus);
    })
    .fail(function () {
        alert("getSchedulesDirectStatus failure");
    })
    .always(function () {
        alert("getSchedulesDirectStatus complete");
    });
}
// end of unused functions

// utility functions
function valueIfMetadataExists(program, metadata) {

    if (metadata in program) {
        return program[metadata];
    }
    return "";
}


function boolValueIfMetadataExists(program, metadata) {

    if (metadata in program) {
        return program[metadata];
    }
    return false;
}


