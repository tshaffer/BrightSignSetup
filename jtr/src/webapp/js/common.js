define(function () {

    return {
        clientType: "",
        browserTypeIsSafari: false,
        
        baseURL: "",
        baseIP: "",
    
        _settingsRetrieved: false,
        _settings: { recordingBitRate: 10, segmentRecordings: 0 },

        _currentRecordings: {},
        
        currentActiveElementId: "#homePage",
        
        recordedPageIds: [],
        scheduledRecordingIds: [],
        
        cgPopupId: "",
        cgPopupTitle: "",
        cgPopupElements: null,
        cgPopupHandlers: null,
        
        cgRecordEpisodeId: null,
        cgRecordSeriesId: null,
        cgTuneEpisodeId: null,
        cgCloseEpisodeId: null,
        
        cgRecordSetOptionsId: null,
        cgRecordViewUpcomingEpisodesId: null,
        cgCancelRecordingId: null,
        cgCancelSeriesId: null,
        
        cgSelectedStationId: null,
        cgSelectedProgram: null,
        cgPopupSelectedIndex: null,

        cgPopupEpisodeElements: ["#cgProgramRecord", "#cgProgramRecordSetOptions", "#cgProgramViewUpcomingEpisodes", "#cgProgramTune", "#cgProgramClose"],

        cgPopupScheduledProgramElement: ["#cgCancelScheduledRecording", "#cgScheduledRecordChangeOptions", "#cgScheduledRecordingViewUpcomingEpisodes", "#cgScheduledRecordingTune", "#cgScheduledRecordingClose"],

        cgPopupSeriesElements: ["#cgEpisodeRecord", "cgSeriesRecordSetProgramOptions", "#cgSeriesRecord", "#cgSeriesTune", "#cgSeriesClose"],

        cgPopupScheduledSeriesElements: ["cgSeriesCancelEpisode", "cgSeriesCancelSeries", "cgSeriesViewUpcoming", "cgSeriesRecordingTune", "cgSeriesRecordingClose"],

        stopTimeOptions: ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"],
        stopTimeOffsets: [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180],
    
        stopTimeOnTimeIndex: 4,
        stopTimeIndex: null,
    
        startTimeOptions: ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"],
        startTimeOnTimeIndex: 3,
        startTimeOffsets: [-15, -10, -5, 0, 5, 10, 15],
        startTimeIndex: null,

// home page
        mainMenuIds: [
            ['recordedShows', 'liveVideo'],
            ['recordNow', 'channelGuide'],
            ['manualRecord', 'toDoList'],
            ['', 'settings']
        ],

        init: function(baseURL, browser, channelGuide) {

            this.baseURL = baseURL;
            this.browser = browser;
            this.common = this;
            this.channelGuide = channelGuide;

            this.cgPopupEpisodeHandlers = [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordProgramViewUpcomingEpisodes, this.cgTune, this.cgModalClose];
            this.cgPopupScheduledProgramHandlers = [this.cgCancelScheduledRecording, this.cgChangeScheduledRecordingOptions, this.cgScheduledRecordingViewUpcomingEpisodes, this.cgScheduledRecordingTune, this.cgScheduledRecordingClose];
            this.cgPopupSeriesHandlers = [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordSelectedSeries, this.cgTune, this.cgModalClose];
            this.cgPopupSchedulesSeriesHandlers = [this.cgCancelScheduledRecording, this.cgCancelScheduledSeries, this.cgScheduledSeriesViewUpcoming, this.cgTune, this.cgModalClose];

            var self = this;

            $("#recordedShows").click(function (event) {
                self.selectRecordedShows();
                return false;
            });

            $("#settings").click(function (event) {
                self.selectSettings();
                return false;
            });

            $("#toDoList").click(function (event) {
                self.selectToDoList();
                return false;
            });

            $("#liveVideo").click(function (event) {
                self.selectLiveVideo();
                return false;
            });

            $("#recordNow").click(function (event) {
                self.selectRecordNow();
                return false;
            });

            $("#manualRecord").click(function (event) {
                self.selectManualRecord();
                return false;
            });

            // REQUIREDTODO
            $("#homeButton").click(function (event) {
                self.selectHomePage();
                return false;
            });
            $("#btnHome").click(function (event) {
                self.browser.selectHomePage();
                return false;
            });

            $("#btnRemoteRecord").click(function (event) {
                self.browser.remoteRecord();
                return false;
            });

            $("#btnRemoteStop").click(function (event) {
                self.browser.remoteStop();
                return false;
            });

            $("#btnRemoteRewind").click(function (event) {
                self.browser.remoteRewind();
                return false;
            });

            $("#btnRemoteInstantReplay").click(function (event) {
                self.browser.remoteInstantReplay();
                return false;
            });

            $("#btnRemotePause").click(function (event) {
                self.browser.remotePause();
                return false;
            });

            $("#btnRemotePlay").click(function (event) {
                self.browser.remotePlay();
                return false;
            });

            $("#btnRemoteQuickSkip").click(function (event) {
                self.browser.remoteQuickSkip();
                return false;
            });

            $("#btnRemoteFastForward").click(function (event) {
                self.browser.remoteFastForward();
                return false;
            });
        },

        addMinutes: function(date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        },

        addMilliseconds: function(date, milliseconds) {
            return new Date(date.getTime() + milliseconds);
        },

        msecToMinutes: function (msec) {
            return msec / 60000;
        },

        minutesToMsec: function (minutes) {
            return minutes * 60000;
        },

        switchToPage: function (newPage) {

            var newPageId = "#" + newPage;
            $(this.currentActiveElementId).css("display", "none");
            this.currentActiveElementId = newPageId;
            $(this.currentActiveElementId).removeAttr("style");
            if (this.currentActiveElementId == "#homePage") {
                this.setFooterVisibility(true, false)
                $("#trickModeKeys").css("display", "block");

                // ensure that the first element is highlighted and has focus
                // TODO - make this more general purpose?
                for (i = 0; i < this.mainMenuIds.length; i++) {
                    for (j = 0; j < this.mainMenuIds[i].length; j++) {
                        var elementId = "#" + this.mainMenuIds[i][j];

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
                this.setFooterVisibility(true, true)
                $("#ipAddress").css("display", "none");
            }
        },


        selectHomePage: function () {
            this.switchToPage("homePage");
        },


        selectRecordedShows: function () {
            this.switchToPage("recordedShowsPage");
            this.getRecordedShows();
        },


        getRecordedShows: function () {

            console.log("getRecordedShows() invoked");

            var aUrl = this.baseURL + "getRecordings";

            var self = this;

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

                    self._currentRecordings = {};

                    $.each(jtrRecordings, function (index, jtrRecording) {
                        toAppend += self.addRecordedShowsLine(jtrRecording);
                        recordingIds.push(jtrRecording.RecordingId);
                        self._currentRecordings[jtrRecording.RecordingId] = jtrRecording;
                    });

                    // is there a reason to do this all at the end instead of once for each row?
                    $("#recordedShowsTableBody").append(toAppend);

                    self.recordedPageIds.length = 0;

                    // get last selected show from local storage - navigate to it. null if not defined
                    var url = self.baseURL + "lastSelectedShow";

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
                                $(btnIdRecording).click({ recordingId: recordingId }, function (event) {
                                    self.browser.playSelectedShow(event);
                                });

                                // delete a recording
                                var btnIdDelete = "#delete" + recordingId;
                                $(btnIdDelete).click({ recordingId: recordingId }, function (event) {
                                    self.browser.deleteSelectedShow(event);
                                });

                                // play from beginning
                                var btnIdPlayFromBeginning = "#repeat" + recordingId;
                                $(btnIdPlayFromBeginning).click({ recordingId: recordingId }, function (event) {
                                    self.browser.playSelectedShowFromBeginning(event);
                                });

                                // stream a recording
                                var btnIdStream = "#stream" + recordingId;
                                $(btnIdStream).click({ recordingId: recordingId, hlsUrl: recording.HLSUrl }, function (event) {
                                    self.browser.streamSelectedShow(event);
                                });

                                // highlight the last selected show
                                if (recordingId == lastSelectedShowId) {
                                    focusApplied = true;
                                    $(btnIdRecording).focus();
                                }

                                var recordedPageRow = [];
                                recordedPageRow.push(btnIdRecording);
                                recordedPageRow.push(btnIdDelete);
                                self.recordedPageIds.push(recordedPageRow);

                            });

                            if (!focusApplied) {
                                // REQUIREDTODO??
                                $(self.recordedPageIds[0][0]).focus();
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
        },


        addRecordedShowsLine: function (jtrRecording) {

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
        },


        retrieveSettings: function () {

            var self = this;

            return new Promise(function(resolve, reject) {

                // get settings from db
                var url = this.baseURL + "getSettings";
                $.get(url, {})
                    .done(function (result) {
                        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX retrieveSettings success ************************************");
                        self._settingsRetrieved = true;
                        self._settings.recordingBitRate = result.RecordingBitRate;
                        self._settings.segmentRecordings = result.SegmentRecordings;
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        reject();
                        debugger;
                        console.log("getSettings failure");
                    })
                    .always(function () {
                    });
            })
        },

        selectSettings: function () {

            this.switchToPage("settingsPage");

            console.log("selectSettings invoked");

            var self = this;
            var promise = this.retrieveSettings();
            promise.then(function() {
                self.initializeSettingsUIElements();
            })

            $(".recordingQuality").change(function () {
                self._settings.recordingBitRate = $('input:radio[name=recordingQuality]:checked').val();
                self.updateSettings();
            });

            $("#segmentRecordingsCheckBox").change(function () {
                var segmentRecordings = $("#segmentRecordingsCheckBox").is(':checked');
                self._settings.segmentRecordings = segmentRecordings ? 1 : 0;
                self.updateSettings();
            });
        },


        initializeSettingsUIElements: function () {

            // initialize UI on settings page
            // TODO - don't hard code these values; read through html
            switch (this._settings.recordingBitRate) {
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

            switch (this._settings.segmentRecordings) {
                case 0:
                    $("#segmentRecordingsCheckBox").prop('checked', false);
                    break;
                case 1:
                    $("#segmentRecordingsCheckBox").prop('checked', true);
                    break;
            }
        },

        updateSettings: function () {
            var url = this.baseURL + "setSettings";
            var settingsData = { "recordingBitRate": this._settings.recordingBitRate, "segmentRecordings": this._settings.segmentRecordings };
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
        },


        selectToDoList: function () {
            this.switchToPage("toDoListPage");
            this.getToDoList();
        },


        getToDoList: function () {

            var self = this;

            console.log("getToDoList() invoked");

            var getStationsPromise = new Promise(function (resolve, reject) {

                var aUrl = this.baseURL + "getStations";

                $.get(
                    aUrl
                ).then(function (stations) {
                        resolve(stations);
                    }, function () {
                        reject();
                    });
            });

            getStationsPromise.then(function(stations) {

                var aUrl = this.baseURL + "getScheduledRecordings";
                var currentDateTimeIso = new Date().toISOString();
                var currentDateTime = { "currentDateTime": currentDateTimeIso };

                $.get(aUrl, currentDateTime)
                    .done(function (scheduledRecordings) {
                        console.log("getScheduledRecordings success");

                        // display scheduled recordings
                        var toAppend = "";

                        $("#scheduledRecordingsTableBody").empty();

                        $.each(scheduledRecordings, function (index, scheduledRecording) {
                            toAppend += self.addScheduledRecordingShowLine(scheduledRecording, stations);
                        });

                        $("#scheduledRecordingsTableBody").append(toAppend);

                        self.scheduledRecordingIds.length = 0;

                        // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                        $.each(scheduledRecordings, function (index, scheduledRecording) {

                            var scheduledRecordingId = scheduledRecording.Id;

                            // only one of the next two handlers can be invoked - that is, either btnIdStop or btnIdDelete exists

                            // stop an active recording
                            var btnIdStop = "#stop" + scheduledRecordingId;
                            $(btnIdStop).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                                self.browser.stopActiveRecording(event);
                            });

                            // delete a scheduled recording
                            var btnIdDelete = "#delete" + scheduledRecordingId;
                            $(btnIdDelete).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                                self.browser.deleteScheduledRecordingHandler(event);
                            });

                            var scheduledRecordingRow = [];
                            scheduledRecordingRow.push(btnIdDelete);
                            self.scheduledRecordingIds.push(scheduledRecordingRow);
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
        },

        addScheduledRecordingShowLine: function (scheduledRecording, stations) {

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

            var minutesLbl = this.twoDigitFormat(date.getMinutes().toString());

            var timeOfDay = hoursLbl + ":" + minutesLbl + amPM;

            var channel = scheduledRecording.Channel;
            var channelParts = channel.split('-');
            if (channelParts.length == 2 && channelParts[1] == "1") {
                channel = channelParts[0];
            }

            var station = this.channelGuide.getStationFromAtsc(stations, channelParts[0], channelParts[1]);

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
        },


        selectLiveVideo: function () {

        },


        setElementVisibility: function (divId, show) {
            if (show) {
                $(divId).show();
            }
            else {
                $(divId).hide();
            }
        },


        selectRecordNow: function () {

            this.switchToPage("recordNowPage");

            var self = this;

            $("#btnRecordNow").click(function (event) {
                self.browser.recordNow();
                return false;
            });

            $("#rbRecordNowTuner").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", true);
            });

            $("#rbRecordNowRoku").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", false);
            });

            $("#rbRecordNowTivo").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", false);
            });

            this.setDefaultDateTimeFields();
            $("#recordNowTitle").focus();
        },


        selectManualRecord: function () {

            this.switchToPage("manualRecordPage");

            var self = this;

            $("#btnSetManualRecord").click(function (event) {
                self.browser.createManualRecording();
                return false;
            });

            $("#rbManualRecordTuner").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", true);
            });

            $("#rbManualRecordRoku").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#rbManualRecordTivo").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            this.setDefaultDateTimeFields();
            $("#manualRecordTitle").focus();
        },


        twoDigitFormat: function (val) {
            val = '' + val;
            if (val.length === 1) {
                val = '0' + val.slice(-2);
            }
            return val;
        },


        setDefaultDateTimeFields: function () {

            var date = new Date();

            var dateVal = date.getFullYear() + "-" + this.twoDigitFormat((date.getMonth() + 1)) + "-" + this.twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = this.twoDigitFormat(date.getHours()) + ":" + this.twoDigitFormat(date.getMinutes());
            $("#manualRecordTime").val(timeVal);
        },

        getRecordingTitle: function (titleId, dateObj, inputSource, channel) {

            var title = $(titleId).val();
            if (!title) {
                title = 'MR ' + dateObj.getFullYear() + "-" + this.twoDigitFormat((dateObj.getMonth() + 1)) + "-" + this.twoDigitFormat(dateObj.getDate()) + " " + this.twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
                if (inputSource == "tuner") {
                    title += " Channel " + channel;
                } else if (inputSource == "tivo") {
                    title += " Tivo";
                } else {
                    title += " Roku";
                }
            }

            return title;
        },

        recordedShowDetails: function (showId) {
            // body...
            this.switchToPage("recordedShowDetailsPage");
            var showTitle = this.getShowTitle(showId);
            var showDescription = this.getShowDescription(showId);

            var toAppend = "<h3>" + showTitle + "</h3><br><br>"
                + "<p>" + showDescription + "</p><br><br>"
                + "<button>Play</button><br><br>"
                + "<button>Delete</button>";

            $("#recordedShowDetailsPage").append(toAppend);
        },

        getShowTitle: function (showId) {
            // body...
        },

        getShowDescription: function (showId) {
            // body...
        },


        // TODO - don't think this will work on remoteWebSite - postMessage is a device method
        cgTune: function () {

            // enter live video
            var event = {};
            event["EventType"] = "TUNE_LIVE_VIDEO";
            postMessage(event);

            // tune to selected channel
            var stationName = this.channelGuide.getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");
            event["EventType"] = "TUNE_LIVE_VIDEO_CHANNEL";
            event["EnteredChannel"] = stationName;
            postMessage(event);

            return "tune";
        },


        cgTuneFromClient: function () {

            var stationName = this.channelGuide.getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var aUrl = this.baseURL + "browserCommand";
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
        },


        updateCGProgramDlgSelection: function () {

            for (i = 0; i < this.cgPopupElements.length; i++) {
                $(this.cgPopupElements[i]).removeClass("btn-primary");
                $(this.cgPopupElements[i]).addClass("btn-secondary");
            }

            $(this.cgPopupElements[this.cgPopupSelectedIndex]).removeClass("btn-secondary");
            $(this.cgPopupElements[this.cgPopupSelectedIndex]).addClass("btn-primary");
        },

        // EXTENDOMATIC TODO - do the work associated with extendomatic here
        // TODO - don't think this will work on remoteWebSite - postMessage is a device method
        cgRecordProgram: function () {
            // redundant in some cases (when selected from pop up); not when record button pressed
            var programData = this.channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            var event = {};
            event["EventType"] = "ADD_RECORD";
            event["DateTime"] = this.cgSelectedProgram.date;
            event["Title"] = this.cgSelectedProgram.title;
            event["Duration"] = this.cgSelectedProgram.duration;
            event["InputSource"] = "tuner";
            event["ScheduledSeriesRecordingId"] = this.cgSelectedProgram.scheduledSeriesRecordingId;
            event["StartTimeOffset"] = 0;
            event["StopTimeOffset"] = 0;

            var stationName = this.channelGuide.getStationFromId(this.cgSelectedStationId);

            stationName = stationName.replace(".", "-");

            event["Channel"] = stationName;

            event["RecordingBitRate"] = this._settings.recordingBitRate;
            event["SegmentRecording"] = this._settings.segmentRecordings;

            // REQUIREDTODO
            postMessage(event);

            return "record";
        },


        cgRecordSelectedProgram: function () {

            // setting this.cgSelectedProgram and this.cgSelectedStationId is redundant in some cases (when selected from pop up); not when record button pressed
            var programData = this.channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.cgRecordProgram();
        },

        cgRecordProgramFromClient: function (addRecording) {

            console.log("cgRecordProgramFromClient invoked");

            var programData = this.channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.cgSelectedProgram.startTimeOffset = this.startTimeOffsets[this.startTimeIndex];
            this.cgSelectedProgram.stopTimeOffset = this.stopTimeOffsets[this.stopTimeIndex];

            var aUrl = this.baseURL + "browserCommand";

            if (addRecording) {
                var stationName = this.channelGuide.getStationFromId(this.cgSelectedStationId);
                stationName = stationName.replace(".", "-");

                var commandData = { "command": "addRecord", "dateTime": this.cgSelectedProgram.date, "title": this.cgSelectedProgram.title, "duration": this.cgSelectedProgram.duration,
                    "inputSource": "tuner", "channel": stationName, "recordingBitRate": this._settings.recordingBitRate, "segmentRecording": this._settings.segmentRecordings,
                    "scheduledSeriesRecordingId": this.cgSelectedProgram.scheduledSeriesRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset, "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset };
            }
            else {
                var commandData = { "command": "updateScheduledRecording", "id": this.cgSelectedProgram.scheduledRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset, "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset };
            }

            console.log(commandData);

            return new Promise(function(resolve, reject) {

                $.get(aUrl, commandData)
                    .done(function (result) {
                        console.log("cgRecordProgramFromClient: add or update record processing complete");
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        reject();
                        console.log("browserCommand failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
                })
        },


        cgRecordSelectedSeriesFromClient: function () {

            var self = this;

            return new Promise(function(resolve, reject) {

                var programData = self.channelGuide.getSelectedStationAndProgram();
                self.cgSelectedProgram = programData.program;
                self.cgSelectedStationId = programData.stationId;

                var stationName = self.channelGuide.getStationFromId(self.cgSelectedStationId);
                stationName = stationName.replace(".", "-");

                var aUrl = self.baseURL + "browserCommand";
                var commandData = {
                    "command": "addSeries",
                    "title": self.cgSelectedProgram.title,
                    "inputSource": "tuner",
                    "channel": stationName,
                    "recordingBitRate": self._settings.recordingBitRate,
                    "segmentRecording": self._settings.segmentRecordings
                };
                console.log(commandData);

                $.get(aUrl, commandData)
                    .done(function (result) {
                        console.log("browserCommand addSeries successfully sent");
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        reject();
                        console.log("browserCommand failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            });
        },

        cgRecordSelectedSeries: function () {
            return this.cgRecordProgram();
        },


        // new handlers
        cgCancelScheduledRecording: function () {
            console.log("cgCancelScheduledRecording invoked");
        },

        cgCancelScheduledSeries: function () {
            console.log("cgCancelScheduledSeries invoked");
        },


        cgScheduledSeriesViewUpcoming: function () {
            console.log("cgScheduledSeriesViewUpcoming invoked");
        },

        cgCancelScheduledRecordingFromClient: function () {
            console.log("cgCancelScheduledRecordingFromClient invoked");
            var programData = this.channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            //this.browser.deleteScheduledRecording(this.cgSelectedProgram.scheduledRecordingId, nextFunction);

            return this.browser.deleteScheduledRecording(this.cgSelectedProgram.scheduledRecordingId);
        },


        cgCancelScheduledSeriesFromClient: function () {
            console.log("cgCancelScheduledSeriesFromClient invoked");
            var programData = this.channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            return this.browser.deleteScheduledSeries(this.cgSelectedProgram.scheduledSeriesRecordingId);
        },

        cgRecordProgramSetOptions: function () {

            var self = this;

            console.log("cgRecordProgramSetOptions invoked");

            // erase existing dialog, show new one
            this.cgProgramDlgCloseInvoked();

            // use common code in displayCGPopUp??
            var options = {
                "backdrop": "true"
            }
            $("#cgRecordingOptionsDlg").modal(options);
            $("#cgRecordingOptionsTitle").html(this.cgSelectedProgram.title);

            // add handlers
            $("#btnCGRecordOptionsNextEarlyStartTime").click(function (event) {
                //$("#btnCGRecordOptionsNextEarlyStartTime").off();
                self.cgRecordOptionsNextEarlyStartTime();
                return false;
            });

            $("#btnCGRecordOptionsNextLateStartTime").click(function (event) {
                //$("#btnCGRecordOptionsNextLateStartTime").off();
                self.cgRecordOptionsNextLateStartTime();
                return false;
            });

            $("#btnCGRecordOptionsNextEarlyStopTime").click(function (event) {
                //$("#btnCGRecordOptionsNextEarlyStopTime").off();
                self.cgRecordOptionsNextEarlyStopTime();
                return false;
            });

            $("#btnCGRecordOptionsNextLateStopTime").click(function (event) {
                //$("#btnCGRecordOptionsNextLateStopTime").off();
                self.cgRecordOptionsNextLateStopTime();
                return false;
            });

            // for a program that has not been setup to record, this.cgSelectedProgram.startTimeOffset = 0, etc.
            this.stopTimeIndex = this.stopTimeOnTimeIndex;
            this.startTimeIndex = this.startTimeOnTimeIndex;

            $.each(this.startTimeOffsets, function (index, startTimeOffset) {
                if (startTimeOffset == self.cgSelectedProgram.startTimeOffset) {
                    this.startTimeIndex = index;
                    return false;
                }
            });

            $.each(this.stopTimeOffsets, function (index, stopTimeOffset) {
                if (stopTimeOffset == self.cgSelectedProgram.stopTimeOffset) {
                    this.stopTimeIndex = index;
                    return false;
                }
            });

            this.displayStartTimeSetting();
            this.displayStopTimeSetting();

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
            if (this.cgSelectedProgram.scheduledRecordingId > 0) {
                addRecordToDB = false;
            }
            $("#cgRecordOptionsSave").click(function (event) {
                $("#cgRecordOptionsSave").unbind("click");
                $("#cgRecordingOptionsDlg").modal('hide');
                //self.cgRecordProgramFromClient(addRecordToDB, self.channelGuide.retrieveScheduledRecordings);

                var promise = self.cgRecordProgramFromClient(addRecordToDB);
                promise.then(function() {
                    self.channelGuide.retrieveScheduledRecordings();
                })

                self.channelGuide.reselectCurrentProgram();
            });

            $("#cgRecordOptionsCancel").click(function (event) {
                $("#cgRecordingOptionsDlg").modal('hide');
                self.channelGuide.reselectCurrentProgram();
            });
        },

        cgRecordOptionsNextEarlyStopTime: function () {
            console.log("cgRecordOptionsNextEarlyStopTime invoked");

            if (this.stopTimeIndex > 0) {
                this.stopTimeIndex--;
                this.displayStopTimeSetting();
            }
        },

        displayStopTimeSetting: function () {
            $("#cgRecordOptionsStopTimeLabel")[0].innerHTML = this.stopTimeOptions[this.stopTimeIndex];
        },

        cgRecordOptionsNextLateStopTime: function () {
            console.log("cgRecordOptionsNextLateStopTime invoked");

            if (this.stopTimeIndex < (this.stopTimeOptions.length-1)) {
                this.stopTimeIndex++;
                this.displayStopTimeSetting();
            }
        },

        cgRecordOptionsNextEarlyStartTime: function () {
            console.log("cgRecordOptionsNextEarlyStartTime invoked");

            if (this.startTimeIndex > 0) {
                this.startTimeIndex--;
                this.displayStartTimeSetting();
            }
        },

        displayStartTimeSetting: function () {
            $("#cgRecordOptionsStartTimeLabel")[0].innerHTML = this.startTimeOptions[this.startTimeIndex];
        },

        cgRecordOptionsNextLateStartTime: function () {
            console.log("cgRecordOptionsNextLateStartTime invoked");

            if (this.startTimeIndex < (this.startTimeOptions.length-1)) {
                this.startTimeIndex++;
                this.displayStartTimeSetting();
            }
        },

        cgRecordProgramViewUpcomingEpisodes: function () {
            console.log("cgRecordProgramViewUpcomingEpisodes invoked");
        },

        cgChangeScheduledRecordingOptions: function () {
            console.log("cgChangeScheduledRecordingOptions invoked");
        },

        cgScheduledRecordingViewUpcomingEpisodes: function () {
            console.log("cgScheduledRecordingViewUpcomingEpisodes invoked");
        },

        cgScheduledRecordingTune: function () {
            console.log("cgScheduledRecordingTune invoked");
        },

        cgScheduledRecordingClose: function () {
            console.log("cgScheduledRecordingClose invoked");
        },

        displayCGPopUp: function () {

            var self = this;

            console.log("displayCGPopUp() invoked");

            var channelGuide = this.channelGuide;

            var programData = channelGuide.getSelectedStationAndProgram();
            this.cgSelectedProgram = programData.program;
            this.cgSelectedStationId = programData.stationId;

            this.stopTimeIndex = this.stopTimeOnTimeIndex;
            this.startTimeIndex = this.startTimeOnTimeIndex;

            // check the program that the user has clicked
            // display different pop ups based on
            //      single vs. series
            //      already scheduled to record or not
            var cgSelectedProgramScheduledToRecord = false;
            this.cgSelectedProgram.scheduledRecordingId = -1;
            this.cgSelectedProgram.scheduledSeriesRecordingId = -1;
            this.cgSelectedProgram.startTimeOffset = 0;
            this.cgSelectedProgram.stopTimeOffset = 0;
            if (channelGuide.scheduledRecordings != null) {
                $.each(channelGuide.scheduledRecordings, function (index, scheduledRecording) {
                    cgSelectedProgramScheduledToRecord = self.programsMatch(scheduledRecording, self.cgSelectedProgram, self.cgSelectedStationId);
                    if (cgSelectedProgramScheduledToRecord) {
                        self.cgSelectedProgram.scheduledRecordingId = scheduledRecording.Id;
                        self.cgSelectedProgram.scheduledSeriesRecordingId = scheduledRecording.ScheduledSeriesRecordingId;
                        self.cgSelectedProgram.startTimeOffset = scheduledRecording.StartTimeOffset;
                        self.cgSelectedProgram.stopTimeOffset = scheduledRecording.StopTimeOffset;
                        return false;
                    }
                });
                console.log("cgSelectedProgramScheduledToRecord=" + cgSelectedProgramScheduledToRecord.toString());
            }

            this.cgRecordEpisodeId = null;
            this.cgRecordSeriesId = null;
            this.cgCancelRecordingId = null;
            this.cgCancelSeriesId = null;
            this.cgRecordSetOptionsId = null;
            this.cgRecordViewUpcomingEpisodesId = null;
            this.cgTuneEpisodeId = null;

            // JTRTODO - optimize the logic here - I think I can make it simpler
            if (this.cgSelectedProgram.showType == "Series") {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {
                    // not yet scheduled to record
                    this.cgPopupId = '#cgSeriesDlg';
                    this.cgPopupTitle = '#cgSeriesDlgShowTitle';
                    this.cgPopupElements = this.cgPopupSeriesElements;
                    this.cgPopupHandlers = this.cgPopupSeriesHandlers;

                    this.cgRecordEpisodeId = "#cgEpisodeRecord";
                    this.cgRecordSetOptionsId = "#cgSeriesRecordSetProgramOptions";
                    this.cgRecordSeriesId = "#cgSeriesRecord";
                    this.cgTuneEpisodeId = "#cgSeriesTune";
                    this.cgCloseEpisodeId = "#cgSeriesClose";
                }
                else {
                    // previously scheduled to record
                    if (this.cgSelectedProgram.scheduledSeriesRecordingId > 0) {
                        this.cgPopupId = '#cgScheduledSeriesDlg';
                        this.cgPopupTitle = '#cgScheduledSeriesDlgTitle';
                        this.cgPopupElements = this.cgPopupScheduledSeriesElements;
                        this.cgPopupHandlers = this.cgPopupSchedulesSeriesHandlers;

                        this.cgCancelRecordingId = "#cgSeriesCancelEpisode";
                        this.cgCancelSeriesId = "#cgSeriesCancelSeries";
                        this.cgRecordViewUpcomingEpisodesId = "#cgSeriesViewUpcoming";
                        this.cgTuneEpisodeId = "#cgSeriesRecordingTune";
                        this.cgCloseEpisodeId = "#cgSeriesRecordingClose";
                    }
                    else {
                        this.cgPopupId = '#cgScheduledRecordingDlg';
                        this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                        this.cgPopupElements = this.cgPopupScheduledProgramElement;
                        this.cgPopupHandlers = this.cgPopupScheduledProgramHandlers;

                        this.cgCancelRecordingId = "#cgCancelScheduledRecording";
                        this.cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
                        this.cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
                        this.cgTuneEpisodeId = "#cgScheduledRecordingTune";
                        this.cgCloseEpisodeId = "#cgScheduledRecordingClose";
                    }
                }
            }
            else        // single program recordings (not series)
            {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {         // no recording set
                    this.cgPopupId = '#cgProgramDlg';
                    this.cgPopupTitle = '#cgProgramDlgShowTitle';
                    this.cgPopupElements = this.cgPopupEpisodeElements;
                    this.cgPopupHandlers = this.cgPopupEpisodeHandlers;

                    this.cgRecordEpisodeId = "#cgProgramRecord";
                    this.cgRecordSetOptionsId = "#cgProgramRecordSetOptions";
                    this.cgRecordViewUpcomingEpisodesId = "#cgProgramViewUpcomingEpisodes";
                    this.cgTuneEpisodeId = "#cgProgramTune";
                    this.cgCloseEpisodeId = "#cgProgramClose";
                }
            else {                                                          // recording already setup
                    this.cgPopupId = '#cgScheduledRecordingDlg';
                    this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                    this.cgPopupElements = this.cgPopupScheduledProgramElement;
                    this.cgPopupHandlers = this.cgPopupScheduledProgramHandlers;

                    this.cgCancelRecordingId = "#cgCancelScheduledRecording";
                    this.cgRecordSetOptionsId = "#cgScheduledRecordChangeOptions";
                    this.cgRecordViewUpcomingEpisodesId = "#cgScheduledRecordingViewUpcomingEpisodes";
                    this.cgTuneEpisodeId = "#cgScheduledRecordingTune";
                    this.cgCloseEpisodeId = "#cgScheduledRecordingClose";
                }
            }

            // setup handlers for browser
            if (this.cgRecordEpisodeId) {
                $(this.cgRecordEpisodeId).off();
                $(this.cgRecordEpisodeId).click(function (event) {
                    $(self.cgRecordEpisodeId).unbind("click");
                    //self.cgRecordProgramFromClient(true, self.channelGuide.retrieveScheduledRecordings);

                    var promise = self.cgRecordProgramFromClient(true);
                    promise.then(function() {
                        self.channelGuide.retrieveScheduledRecordings();
                    })

                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
            });
        }
            if (this.cgRecordSeriesId) {
                $(this.cgRecordSeriesId).off();
                $(this.cgRecordSeriesId).click(function (event) {
                    var promise = self.cgRecordSelectedSeriesFromClient();
                    promise.then(function() {
                        self.channelGuide.retrieveScheduledRecordings();
                    })
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgTuneEpisodeId){
                $(this.cgTuneEpisodeId).off();
                $(this.cgTuneEpisodeId).click(function (event) {
                    self.cgTuneFromClient();
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgCancelRecordingId) {
                $(this.cgCancelRecordingId).off();
                $(this.cgCancelRecordingId).click(function (event) {
                    console.log("CancelRecording invoked");
                    //self.cgCancelScheduledRecordingFromClient(self.channelGuide.retrieveScheduledRecordings);

                    var promise = self.cgCancelScheduledRecordingFromClient();
                    promise.then(function() {
                        self.channelGuide.retrieveScheduledRecordings();
                    })

                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgCancelSeriesId) {
                $(this.cgCancelSeriesId).off();
                $(this.cgCancelSeriesId).click(function (event) {
                    console.log("CancelSeriesRecording invoked");
                    var promise = self.cgCancelScheduledSeriesFromClient();
                    promise.then(function() {
                        self.channelGuide.retrieveScheduledRecordings();
                    })
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgRecordSetOptionsId) {
                $(this.cgRecordSetOptionsId).off();
                $(this.cgRecordSetOptionsId).click(function (event) {
                    console.log("recordSetOptions invoked");
                    self.cgRecordProgramSetOptions();
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgRecordViewUpcomingEpisodesId) {
                $(this.cgRecordViewUpcomingEpisodesId).off();
                $(this.cgRecordViewUpcomingEpisodesId).click(function (event) {
                    console.log("ViewUpcomingEpisodes invoked")
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }

            if (this.cgCloseEpisodeId) {
                $(this.cgCloseEpisodeId).off();
                $(this.cgCloseEpisodeId).click(function (event) {
                    self.cgProgramDlgCloseInvoked();
                    self.channelGuide.reselectCurrentProgram();
                });
            }


            this.cgPopupSelectedIndex = 0;

            var options = {
                "backdrop": "true"
            }
            $(this.cgPopupId).modal(options);
            $(this.cgPopupTitle).html(this.cgSelectedProgram.title);

            // highlight first button; unhighlight other buttons
            $(this.cgPopupElements[0]).removeClass("btn-secondary");
            $(this.cgPopupElements[0]).addClass("btn-primary");

            for (i = 1; i < this.cgPopupElements.length; i++) {
                $(this.cgPopupElements[i]).removeClass("btn-primary");
                $(this.cgPopupElements[i]).addClass("btn-secondary");
            }

            $(this.cgPopupId).off("keydown");
            $(this.cgPopupId).keydown(function (keyEvent) {
                var keyIdentifier = event.keyIdentifier;
                console.log("Key " + keyIdentifier.toString() + "pressed")
                if (keyIdentifier == "Up") {
                    self.cgProgramDlgUp();
                }
                else if (keyIdentifier == "Down") {
                    self.cgProgramDlgDown();
                }
                else if (keyIdentifier == "Enter") {
                    var functionInvoked = self.cgPopupHandlers[self.cgPopupSelectedIndex]();
                    self.cgProgramDlgCloseInvoked();
                    // ?? JTRTODO - update scheduled recordings

                }
            });
            // browser event handlers - browser.js - this approach didn't work - why?
            //for (i = 0; i < this.cgPopupEpisodeElements.length; i++) {
            //    var foo = this.cgPopupEpisodeHandlers[i];
            //    var foo2 = this.cgPopupEpisodeElements[i];
            //    $(foo2).click(function () {
            //        foo();
            //    });

            //$(this.cgPopupEpisodeElements[i]).click(function () {
            //    //this.cgPopupEpisodeHandlers[i]();
            //    foo();
            //    cgProgramDlgCloseInvoked();
            //});

            //click(this.cgPopupEpisodeHandlers[i]);
            //}
        },

        programsMatch: function (scheduledRecording, cgProgram, cgStationId) {

            // JTRTODO - what other criteria should be used?
            var channelGuide = this.channelGuide;
            var channel = channelGuide.getChannelFromStationIndex(cgStationId);
            if (channel != scheduledRecording.Channel) return false;

            if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

            if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

            return true;
        },

        cgModalClose: function () {
            // don't need to do anything other than close the dialog
            return "close";
        },


        // brightsign.js only?
        cgSelectEventHandler: function () {
            var functionInvoked = this.cgPopupHandlers[this.cgPopupSelectedIndex]();
            this.cgProgramDlgCloseInvoked();
            // ?? JTRTODO - update scheduled recordings
            return functionInvoked;
        },


        cgProgramDlgUp: function () {

            if (this.cgPopupSelectedIndex > 0) {

                this.cgPopupSelectedIndex--;
                this.updateCGProgramDlgSelection();
            }
        },


        cgProgramDlgDown: function () {
            if (this.cgPopupSelectedIndex < this.cgPopupElements.length - 1) {

                this.cgPopupSelectedIndex++;
                this.updateCGProgramDlgSelection();
            }
        },


        cgProgramDlgCloseInvoked: function () {
            $(this.cgPopupId).modal('hide');
        },


        eraseUI: function () {
            $("#ipAddress").css("display", "none");
            $(this.currentActiveElementId).css("display", "none");
            $("#footerArea").css("display", "none");
        },

        setFooterVisibility: function (trickModeKeysVisibility, homeButtonVisibility) {

            // JTRTODO - check to see if this works. if it doesn't, fix it; if it does, improve it.
            var self = this;
            if (homeButtonVisibility) {
                $("#homeButton").html("<button class='btn btn-primary'>Home</button><br><br>");

                $("#btnHome").click(function (event) {
                    self.selectHomePage();
                });
                $("#homeButton").click(function (event) {
                    self.selectHomePage();
                });
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
    }
});
