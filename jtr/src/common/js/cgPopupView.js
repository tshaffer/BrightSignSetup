/**
 * Created by tedshaffer on 11/11/15.
 */
define(['serverInterface','settingsModel'], function (serverInterface, SettingsModel) {

    //console.log("creating cgPopUpView module");

    var cgPopupView = Backbone.View.extend({

        settingsModel: null,

        cgPopupId: "",
        cgPopupTitle: "",
        cgPopupElements: null,

        cgSelectedStationId: null,
        cgSelectedProgram: null,
        cgPopupSelectedIndex: null,

        cgPopupEpisodeElements: ["#cgProgramRecord", "#cgProgramRecordSetOptions", "#cgProgramViewUpcomingEpisodes", "#cgProgramTune", "#cgProgramClose"],

        cgPopupScheduledProgramElement: ["#cgCancelScheduledRecording", "#cgScheduledRecordChangeOptions", "#cgScheduledRecordingViewUpcomingEpisodes", "#cgScheduledRecordingTune", "#cgScheduledRecordingClose"],

        cgPopupSeriesElements: ["#cgEpisodeRecord", "#cgSeriesRecordSetProgramOptions", "#cgSeriesRecord", "#cgSeriesTune", "#cgSeriesClose"],

        cgPopupScheduledSeriesElements: ["#cgSeriesCancelEpisode", "#cgSeriesCancelSeries", "#cgSeriesViewUpcoming", "#cgSeriesRecordingTune", "#cgSeriesRecordingClose"],

        cgPopupRecordingOptionsElements: ["#cgRecordOptionsStartTimeLabel","#cgRecordOptionsStopTimeLabel","#cgRecordOptionsSave","#cgRecordOptionsCancel"],

        stopTimeOptions: ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"],
        stopTimeOffsets: [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180],

        stopTimeOnTimeIndex: 4,
        stopTimeIndex: null,

        startTimeOptions: ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"],
        startTimeOnTimeIndex: 3,
        startTimeOffsets: [-15, -10, -5, 0, 5, 10, 15],
        startTimeIndex: null,

        initialize: function () {
            //console.log("cgPopupView::initialize");

            this.settingsModel = SettingsModel.getInstance();
            // cgToDo - any reason for this?
            this.listenTo(this.settingsModel, "settingsUpdated", function() {
               //console.log("settingsUpdated");
            });
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
                //console.log("cgSelectedProgramScheduledToRecord=" + cgSelectedProgramScheduledToRecord.toString());
            }

            // JTRTODO - optimize the logic here - I think I can make it simpler
            if (this.cgSelectedProgram.showType == "Series") {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {
                    // not yet scheduled to record
                    this.cgPopupId = '#cgSeriesDlg';
                    this.cgPopupTitle = '#cgSeriesDlgShowTitle';
                    this.cgPopupElements = this.cgPopupSeriesElements;
                }
                else {
                    // previously scheduled to record
                    if (this.cgSelectedProgram.scheduledSeriesRecordingId > 0) {
                        this.cgPopupId = '#cgScheduledSeriesDlg';
                        this.cgPopupTitle = '#cgScheduledSeriesDlgTitle';
                        this.cgPopupElements = this.cgPopupScheduledSeriesElements;
                    }
                    else {
                        this.cgPopupId = '#cgScheduledRecordingDlg';
                        this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                        this.cgPopupElements = this.cgPopupScheduledProgramElement;
                    }
                }
            }
            else        // single program recordings (not series)
            {
                if (this.cgSelectedProgram.scheduledRecordingId == -1) {         // no recording set
                    this.cgPopupId = '#cgProgramDlg';
                    this.cgPopupTitle = '#cgProgramDlgShowTitle';
                    this.cgPopupElements = this.cgPopupEpisodeElements;
                }
                else {                                                          // recording already setup
                    this.cgPopupId = '#cgScheduledRecordingDlg';
                    this.cgPopupTitle = '#cgProgramScheduledDlgShowTitle';
                    this.cgPopupElements = this.cgPopupScheduledProgramElement;
                }
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

            // remote control handler - click
            // event.target is 'this.cgPopupId', not the id of the button actually pressed (which is why the click handler is added to cgPopupId)
            $(this.cgPopupId).click(function (event) {

                $(self.cgPopupId).off();
                self.processSelect(event);

            });

            $(this.cgPopupId).off("keydown");
            $(this.cgPopupId).keydown(function (keyEvent) {
                var command = "";

                var keyCode = keyEvent.which;
                switch (keyCode) {
                    case constants.KEY_ENTER:
                        var popupId = self.cgPopupId.substring(1);
                        console.log("popupId: " + popupId);
                        console.log("cgPopupSelectedIndex: " + self.cgPopupSelectedIndex);
                        self.processSelect(keyEvent);
                        break;
                    case constants.KEY_UP:
                        self.cgProgramDlgUp();
                        break;
                    case constants.KEY_DOWN:
                        self.cgProgramDlgDown();
                        break;
                    case "exit":
                        $(self.cgPopupId).modal('hide');
                        self.reselectCurrentProgram();
                        break;
                }

                return false;
            });
        },


        processSelect: function(event) {

            var self = this;

            // remove "#" to get the element id
            var popupId = self.cgPopupId.substring(1);

            if (popupId == event.target.id) {
                // remote control event
                switch (self.cgPopupId) {
                    case "#cgProgramDlg":
                        switch (self.cgPopupSelectedIndex) {
                            case 0:
                                self.invokeRecordEpisode();
                                break;
                            case 1:
                                self.invokeRecordProgramSetOptions();
                                break;
                            case 2:
                                self.invokeViewUpcomingEpisodes();
                                break;
                            case 3:
                                self.invokeTune();
                                break;
                            case 4:
                                self.invokeCloseDialog();
                                break;
                        }
                        break;
                    case "#cgScheduledRecordingDlg":
                        switch (self.cgPopupSelectedIndex) {
                            case 0:
                                self.invokeCancelRecording();
                                break;
                            case 1:
                                self.invokeRecordProgramSetOptions();
                                break;
                            case 2:
                                self.invokeViewUpcomingEpisodes();
                                break;
                            case 3:
                                self.invokeTune();
                                break;
                            case 4:
                                self.invokeCloseDialog();
                                break;
                        }
                        break;
                    case "#cgSeriesDlg":
                        switch (self.cgPopupSelectedIndex) {
                            case 0:
                                self.invokeRecordEpisode();
                                break;
                            case 1:
                                self.invokeRecordProgramSetOptions();
                                break;
                            case 2:
                                self.invokeRecordSeries();
                                break;
                            case 3:
                                self.invokeTune();
                                break;
                            case 4:
                                self.invokeCloseDialog();
                                break;
                        }
                        break;
                    case "#cgScheduledSeriesDlg":
                        switch (self.cgPopupSelectedIndex) {
                            case 0:
                                self.invokeCancelRecording();
                                break;
                            case 1:
                                self.invokeCancelSeries();
                                break;
                            case 2:
                                self.invokeViewUpcomingEpisodes();
                                break;
                            case 3:
                                self.invokeTune();
                                break;
                            case 4:
                                self.invokeCloseDialog();
                                break;
                        }
                        break;
                }
            }
            else {
                //console.log("---------------------------" + event.target.id);
                switch (event.target.id) {
                    case "cgProgramRecord":
                    case "cgEpisodeRecord":
                        self.invokeRecordEpisode();
                        break;
                    case "cgProgramRecordSetOptions":
                    case "cgSeriesRecordSetProgramOptions":
                    case "cgScheduledRecordChangeOptions":
                        self.invokeRecordProgramSetOptions();
                        break;
                    case "cgProgramViewUpcomingEpisodes":
                    case "cgScheduledRecordingViewUpcomingEpisodes":
                    case "cgSeriesViewUpcoming":
                        self.invokeViewUpcomingEpisodes();
                        break;
                    case "cgProgramTune":
                    case "cgSeriesTune":
                    case "cgSeriesRecordingTune":
                    case "cgScheduledRecordingTune":
                        self.invokeTune();
                        break;
                    case "cgProgramClose":
                    case "cgSeriesClose":
                    case "cgSeriesRecordingClose":
                    case "cgScheduledRecordingClose":
                        self.invokeCloseDialog();
                        break;
                    case "cgCancelScheduledRecording":
                    case "cgSeriesCancelEpisode":
                        self.invokeCancelRecording();
                        break;
                    case "cgSeriesRecord":
                        self.invokeRecordSeries();
                        break;
                    case "cgSeriesCancelSeries":
                        self.invokeCancelSeries();
                        break;
                    default:
                        break;
                }
            }

        },


        programsMatch: function (scheduledRecording, cgProgram, cgStationId) {

            // JTRTODO - what other criteria should be used?
            var channelGuide = this.channelGuide;
            var channel = this.stationsModel.getChannelFromStationIndex(cgStationId);
            if (channel != scheduledRecording.Channel) return false;

            if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

            if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

            return true;
        },

        cgRecordProgramFromClient: function (addRecording) {

            //console.log("cgRecordProgramFromClient invoked");

            this.cgSelectedProgram.startTimeOffset = this.startTimeOffsets[this.startTimeIndex];
            this.cgSelectedProgram.stopTimeOffset = this.stopTimeOffsets[this.stopTimeIndex];

            if (addRecording) {
                var stationName = this.stationsModel.getStationFromId(this.cgSelectedStationId);
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
                    "stopTimeOffset": this.cgSelectedProgram.stopTimeOffset,
                    "programId": ""
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

            var stationName = this.stationsModel.getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var commandData = {
                "command": "addSeries",
                "title": this.cgSelectedProgram.title,
                "inputSource": "tuner",
                "channel": stationName,
                "recordingBitRate": this.settingsModel.getRecordingBitRate(),
                "segmentRecording": this.settingsModel.getSegmentRecordings()
            };

            return serverInterface.browserCommand(commandData);
        },

        cgProgramDlgCloseInvoked: function () {
            $(this.cgPopupId).modal('hide');
        },

        reselectCurrentProgram: function () {
            this.trigger("cgPopupViewExit");
        },

        cgTuneFromClient: function () {

            var stationName = this.stationsModel.getStationFromId(this.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var commandData = { "command": "tuneLiveVideoChannel", "enteredChannel": stationName };

            serverInterface.browserCommand(commandData);
        },

        cgCancelScheduledRecordingFromClient: function () {
            //console.log("cgCancelScheduledRecordingFromClient invoked");

            return serverInterface.deleteScheduledRecording(this.cgSelectedProgram.scheduledRecordingId);
        },

        cgCancelScheduledSeriesFromClient: function () {
            //console.log("cgCancelScheduledSeriesFromClient invoked");
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

        cgRecordProgramSetOptions: function () {

            var self = this;

            //console.log("cgRecordProgramSetOptions invoked");

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

            $("#cgRecordingOptionsDlg").off("keydown");
            $("#cgRecordingOptionsDlg").keydown(function (keyEvent) {

                var command = "";

                var keyCode = keyEvent.which;
                switch (keyCode) {
                    case constants.KEY_ENTER:
                        switch (self.cgPopupSelectedIndex) {
                            case 0:
                                break;
                            case 1:
                                break;
                            case 2:
                                self.cgRecordOptionsSave(addRecordToDB);
                                break;
                            case 3:
                                self.cgRecordOptionsCancel();
                                break;
                        }
                        return;
                        break;
                    case constants.KEY_LEFT:
                        if (self.cgPopupSelectedIndex == 0) {
                            self.cgRecordOptionsNextEarlyStartTime();
                        }
                        else if (self.cgPopupSelectedIndex == 1) {
                            self.cgRecordOptionsNextEarlyStopTime();
                        }
                        break;
                    case constants.KEY_RIGHT:
                        if (self.cgPopupSelectedIndex == 0) {
                            self.cgRecordOptionsNextLateStartTime();
                        }
                        else if (self.cgPopupSelectedIndex == 1) {
                            self.cgRecordOptionsNextLateStopTime();
                        }
                        break;
                    case constants.KEY_UP:
                        self.cgProgramDlgUp();
                        break;
                    case constants.KEY_DOWN:
                        self.cgProgramDlgDown();
                        break;
                    case "exit":
                        $("#cgRecordingOptionsDlg").modal('hide');
                        self.reselectCurrentProgram();
                        break;
                }

                return false;
            });

            var addRecordToDB = true;
            if (this.cgSelectedProgram.scheduledRecordingId > 0) {
                addRecordToDB = false;
            }

            $("#cgRecordingOptionsDlg").click(function (event) {
                $("#cgRecordingOptionsDlg").off();
                //("click pressed");

                if (event.target.id == "cgRecordingOptionsDlg") {
                    switch (self.cgPopupSelectedIndex) {
                        case 0:
                            break;
                        case 1:
                            break;
                        case 2:
                            self.cgRecordOptionsSave(addRecordToDB);
                            break;
                        case 3:
                            self.cgRecordOptionsCancel();
                            break;
                    }
                }
                else {
                    switch (event.target.id) {
                        case "cgRecordOptionsSave":
                            self.cgRecordOptionsSave(addRecordToDB);
                            break;
                        case "cgRecordOptionsCancel":
                            self.cgRecordOptionsCancel();
                            break;
                    }
                }
                return false;
            });

            this.cgPopupSelectedIndex = 0;
            this.cgPopupElements = this.cgPopupRecordingOptionsElements;
            //this.cgPopupHandlers = this.cgPopupRecordingOptionsHandlers;

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
            $("#cgRecordOptionsStartTimeLabel").removeClass("btn-secondary");
            $("#cgRecordOptionsStartTimeLabel").addClass("btn-primary");
            $("#cgRecordOptionsStopTimeLabel").removeClass("btn-primary");
            $("#cgRecordOptionsStopTimeLabel").addClass("btn-secondary");
            $("#cgRecordOptionsSave").removeClass("btn-primary");
            $("#cgRecordOptionsSave").addClass("btn-secondary");
            $("#cgRecordOptionsCancel").removeClass("btn-primary");
            $("#cgRecordOptionsCancel").addClass("btn-secondary");

            $("#cgRecordOptionsSave").focus();
        },

        cgRecordOptionsSave: function(addRecordToDB) {
            $("#cgRecordOptionsSave").unbind("click");
            $("#cgRecordingOptionsDlg").modal('hide');
            //self.cgRecordProgramFromClient(addRecordToDB, self.channelGuide.retrieveScheduledRecordings);

            var promise = this.cgRecordProgramFromClient(addRecordToDB);
            promise.then(function() {
                serverInterface.retrieveScheduledRecordings();
            })

            this.reselectCurrentProgram();
        },

        cgRecordOptionsCancel: function() {
            $("#cgRecordingOptionsDlg").modal('hide');
            this.reselectCurrentProgram();
        },

        cgRecordOptionsNextEarlyStartTime: function () {
            //console.log("cgRecordOptionsNextEarlyStartTime invoked");

            if (this.startTimeIndex > 0) {
                this.startTimeIndex--;
                this.displayStartTimeSetting();
            }
        },

        displayStartTimeSetting: function () {
            $("#cgRecordOptionsStartTimeLabel")[0].innerHTML = this.startTimeOptions[this.startTimeIndex];
        },

        cgRecordOptionsNextLateStartTime: function () {
            //console.log("cgRecordOptionsNextLateStartTime invoked");

            if (this.startTimeIndex < (this.startTimeOptions.length-1)) {
                this.startTimeIndex++;
                this.displayStartTimeSetting();
            }
        },

        cgRecordOptionsNextEarlyStopTime: function () {
            //console.log("cgRecordOptionsNextEarlyStopTime invoked");

            if (this.stopTimeIndex > 0) {
                this.stopTimeIndex--;
                this.displayStopTimeSetting();
            }
        },

        cgRecordOptionsNextLateStopTime: function () {
            //console.log("cgRecordOptionsNextLateStopTime invoked");

            if (this.stopTimeIndex < (this.stopTimeOptions.length-1)) {
                this.stopTimeIndex++;
                this.displayStopTimeSetting();
            }
        },

        displayStopTimeSetting: function () {
            $("#cgRecordOptionsStopTimeLabel")[0].innerHTML = this.stopTimeOptions[this.stopTimeIndex];
        },

        invokeRecordEpisode: function() {
            var promise = this.cgRecordProgramFromClient(true);
            promise.then(function() {
                var retrieveScheduledRecordingsPromise = serverInterface.retrieveScheduledRecordings();
            })

            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeRecordProgramSetOptions: function() {
            //console.log("recordSetOptions invoked");
            this.cgRecordProgramSetOptions();
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeRecordSeries: function() {
            var promise = this.cgRecordSelectedSeriesFromClient();
            promise.then(function() {
                serverInterface.retrieveScheduledRecordings();
            })
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeTune: function() {
            this.cgTuneFromClient();
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeCloseDialog: function() {
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeViewUpcomingEpisodes: function() {
            //console.log("ViewUpcomingEpisodes invoked")
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeCancelRecording: function() {
            //console.log("CancelRecording invoked");
            //self.cgCancelScheduledRecordingFromClient(self.channelGuide.retrieveScheduledRecordings);

            var promise = this.cgCancelScheduledRecordingFromClient();
            promise.then(function() {
                serverInterface.retrieveScheduledRecordings();
            })

            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        },

        invokeCancelSeries: function () {
            //console.log("CancelSeriesRecording invoked");
            var promise = this.cgCancelScheduledSeriesFromClient();
            promise.then(function() {
                serverInterface.retrieveScheduledRecordings();
            })
            this.cgProgramDlgCloseInvoked();
            this.reselectCurrentProgram();
        }
    });

    return cgPopupView;
});

