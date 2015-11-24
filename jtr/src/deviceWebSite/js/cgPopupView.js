/**
 * Created by tedshaffer on 11/11/15.
 */
define(['serverInterface','settingsModel'], function (serverInterface, SettingsModel) {

    console.log("creating cgPopUpView module");

    var cgPopupView = Backbone.View.extend({

        settingsModel: null,

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

        cgPopupSeriesElements: ["#cgEpisodeRecord", "#cgSeriesRecordSetProgramOptions", "#cgSeriesRecord", "#cgSeriesTune", "#cgSeriesClose"],

        cgPopupScheduledSeriesElements: ["cgSeriesCancelEpisode", "cgSeriesCancelSeries", "cgSeriesViewUpcoming", "cgSeriesRecordingTune", "cgSeriesRecordingClose"],

        stopTimeOptions: ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"],
        stopTimeOffsets: [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180],

        stopTimeOnTimeIndex: 4,
        stopTimeIndex: null,

        startTimeOptions: ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"],
        startTimeOnTimeIndex: 3,
        startTimeOffsets: [-15, -10, -5, 0, 5, 10, 15],
        startTimeIndex: null,

        initialize: function () {
            console.log("cgPopupView::initialize");
            //this.template = _.template($('#channelGuideTemplate').html());

            this.settingsModel = SettingsModel.getInstance();
            this.listenTo(this.settingsModel, "settingsUpdated", function() {
               console.log("settingsUpdated");
            });
            this.cgPopupEpisodeHandlers = [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordProgramViewUpcomingEpisodes, this.cgTuneFromClient, this.cgModalClose];
            this.cgPopupScheduledProgramHandlers = [this.cgCancelScheduledRecording, this.cgChangeScheduledRecordingOptions, this.cgScheduledRecordingViewUpcomingEpisodes, this.cgScheduledRecordingTune, this.cgScheduledRecordingClose];
            this.cgPopupSeriesHandlers = [this.cgRecordSelectedProgram, this.cgRecordProgramSetOptions, this.cgRecordSelectedSeries, this.cgTuneFromClient, this.cgModalClose];
            this.cgPopupSchedulesSeriesHandlers = [this.cgCancelScheduledRecording, this.cgCancelScheduledSeries, this.cgScheduledSeriesViewUpcoming, this.cgTuneFromClient, this.cgModalClose];
        },

        show: function(programData) {

            var self = this;

            this.scheduledRecordings = serverInterface.getScheduledRecordings();

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
            if (this.scheduledRecordings != null) {
                $.each(this.scheduledRecordings, function (index, scheduledRecording) {
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
                        var retrieveScheduledRecordingsPromise = serverInterface.retrieveScheduledRecordings();
                    })

                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }
            if (this.cgRecordSeriesId) {
                $(this.cgRecordSeriesId).off();
                $(this.cgRecordSeriesId).click(function (event) {
                    var promise = self.cgRecordSelectedSeriesFromClient();
                    promise.then(function() {
                        serverInterface.retrieveScheduledRecordings();
                    })
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgTuneEpisodeId){
                $(this.cgTuneEpisodeId).off();
                $(this.cgTuneEpisodeId).click(function (event) {
                    self.cgTuneFromClient();
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgCancelRecordingId) {
                $(this.cgCancelRecordingId).off();
                $(this.cgCancelRecordingId).click(function (event) {
                    console.log("CancelRecording invoked");
                    //self.cgCancelScheduledRecordingFromClient(self.channelGuide.retrieveScheduledRecordings);

                    var promise = self.cgCancelScheduledRecordingFromClient();
                    promise.then(function() {
                        serverInterface.retrieveScheduledRecordings();
                    })

                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgCancelSeriesId) {
                $(this.cgCancelSeriesId).off();
                $(this.cgCancelSeriesId).click(function (event) {
                    console.log("CancelSeriesRecording invoked");
                    var promise = self.cgCancelScheduledSeriesFromClient();
                    promise.then(function() {
                        serverInterface.retrieveScheduledRecordings();
                    })
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgRecordSetOptionsId) {
                $(this.cgRecordSetOptionsId).off();
                $(this.cgRecordSetOptionsId).click(function (event) {
                    console.log("recordSetOptions invoked");
                    self.cgRecordProgramSetOptions();
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgRecordViewUpcomingEpisodesId) {
                $(this.cgRecordViewUpcomingEpisodesId).off();
                $(this.cgRecordViewUpcomingEpisodesId).click(function (event) {
                    console.log("ViewUpcomingEpisodes invoked")
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
                });
            }

            if (this.cgCloseEpisodeId) {
                $(this.cgCloseEpisodeId).off();
                $(this.cgCloseEpisodeId).click(function (event) {
                    self.cgProgramDlgCloseInvoked();
                    self.reselectCurrentProgram();
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
                    var func = self.cgPopupHandlers[self.cgPopupSelectedIndex];
                    func.call(self);
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
            var channel = this.getChannelFromStationIndex(cgStationId);
            if (channel != scheduledRecording.Channel) return false;

            if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

            if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

            return true;
        },

        getChannelFromStationIndex: function (stationId) {

            var channel = "";

            $.each(this.stations, function (index, station) {
                if (stationId == station.StationId) {
                    channel = station.AtscMajor + "-" + station.AtscMinor;
                    return false;
                }
            });

            return channel;
        },

        cgRecordProgramFromClient: function (addRecording) {

            console.log("cgRecordProgramFromClient invoked");

            this.cgSelectedProgram.startTimeOffset = this.startTimeOffsets[this.startTimeIndex];
            this.cgSelectedProgram.stopTimeOffset = this.stopTimeOffsets[this.stopTimeIndex];

            if (addRecording) {
                var stationName = this.getStationFromId(this.cgSelectedStationId);
                stationName = stationName.replace(".", "-");

                var commandData = {
                    "command": "addRecord",
                    "dateTime": this.cgSelectedProgram.date,
                    "title": this.cgSelectedProgram.title,
                    "duration": this.cgSelectedProgram.duration,
                    "inputSource": "tuner",
                    "channel": stationName,
                    "recordingBitRate": this.settingsModel.getRecordingBitRate(),
                    "segmentRecording": this.settingsModel.getSegmentRecordings(),
                    "scheduledSeriesRecordingId": this.cgSelectedProgram.scheduledSeriesRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset,
                    "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset
                };
            }
            else {
                var commandData = {
                    "command": "updateScheduledRecording",
                    "id": this.cgSelectedProgram.scheduledRecordingId,
                    "startTimeOffset": this.cgSelectedProgram.startTimeOffset,
                    "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset
                };
            }

            return serverInterface.browserCommand(commandData);
        },

        cgRecordSelectedSeriesFromClient: function () {

            var stationName = this.getStationFromId(self.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var commandData = {
                "command": "addSeries",
                "title": self.cgSelectedProgram.title,
                "inputSource": "tuner",
                "channel": stationName,
                "recordingBitRate": this.settingsModel.recordingBitRate,
                "segmentRecording": this.settingsModel.segmentRecordings
            };

            return serverInterface.browserCommand(commandData);
        },

        getStationFromId: function (stationId) {

            var selectedStation = "";

            // get stationIndex
            $.each(this.stations, function (stationIndex, station) {
                if (station.StationId == stationId) {
                    selectedStation = station.AtscMajor + "." + station.AtscMinor;
                    return false;
                }
            });

            return selectedStation;
        },

        cgProgramDlgCloseInvoked: function () {
            $(this.cgPopupId).modal('hide');
        },

        reselectCurrentProgram: function () {
            this.trigger("cgPopupViewExit");
        },

        cgTuneFromClient: function () {

            var stationName = this.getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var commandData = { "command": "tuneLiveVideoChannel", "enteredChannel": stationName };

            serverInterface.browserCommand(commandData);
        },

        cgCancelScheduledRecordingFromClient: function () {
            console.log("cgCancelScheduledRecordingFromClient invoked");

            return serverInterface.deleteScheduledRecording(this.cgSelectedProgram.scheduledRecordingId);
        },

        cgCancelScheduledSeriesFromClient: function () {
            console.log("cgCancelScheduledSeriesFromClient invoked");
            return serverInterface.deleteScheduledSeries(this.cgSelectedProgram.scheduledSeriesRecordingId);
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

        updateCGProgramDlgSelection: function () {

            for (i = 0; i < this.cgPopupElements.length; i++) {
                $(this.cgPopupElements[i]).removeClass("btn-primary");
                $(this.cgPopupElements[i]).addClass("btn-secondary");
            }

            $(this.cgPopupElements[this.cgPopupSelectedIndex]).removeClass("btn-secondary");
            $(this.cgPopupElements[this.cgPopupSelectedIndex]).addClass("btn-primary");
        },

        cgRecordSelectedProgram: function () {

            // JTRTODO - is this invoked when the Record button is pressed on the remote
            // not if this file is for the browser only
            //this.cgRecordProgram();
            this.cgRecordProgramFromClient(true);
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
                    serverInterface.retrieveScheduledRecordings();
                })

                self.reselectCurrentProgram();
            });

            $("#cgRecordOptionsCancel").click(function (event) {
                $("#cgRecordingOptionsDlg").modal('hide');
                self.reselectCurrentProgram();
            });
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

        cgModalClose: function () {
            // don't need to do anything other than close the dialog
            return "close";
        },

        cgCancelScheduledRecording: function () {
            console.log("cgCancelScheduledRecording invoked");
        },

        cgCancelScheduledSeries: function () {
            console.log("cgCancelScheduledSeries invoked");
        },

        cgScheduledSeriesViewUpcoming: function () {
            console.log("cgScheduledSeriesViewUpcoming invoked");
        },

        cgRecordSelectedSeries: function () {
            //return this.cgRecordProgram();
            return this.cgRecordProgramFromClient(true);
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

        cgRecordOptionsNextEarlyStopTime: function () {
            console.log("cgRecordOptionsNextEarlyStopTime invoked");

            if (this.stopTimeIndex > 0) {
                this.stopTimeIndex--;
                this.displayStopTimeSetting();
            }
        },

        cgRecordOptionsNextLateStopTime: function () {
            console.log("cgRecordOptionsNextLateStopTime invoked");

            if (this.stopTimeIndex < (this.stopTimeOptions.length-1)) {
                this.stopTimeIndex++;
                this.displayStopTimeSetting();
            }
        },

        displayStopTimeSetting: function () {
            $("#cgRecordOptionsStopTimeLabel")[0].innerHTML = this.stopTimeOptions[this.stopTimeIndex];
        },


    });

    return cgPopupView;
    });

