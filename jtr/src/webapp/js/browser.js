define(function () {

    return {

        init: function(baseURL, common, channelGuide) {

            this.baseURL = baseURL;
            this.browser = this;
            this.common = common;
            this.channelGuide = channelGuide;

            var self = this;
        },

// send trick commands to device for boomerang back to JS to state machine
        sendRemoteCommandToDevice: function (remoteCommand) {

            console.log("this.sendRemoteCommandToDevice: " + remoteCommand);

            var aUrl = baseURL + "browserCommand";
            var commandData = { "command": "remoteCommand", "value": remoteCommand };
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

        remotePause: function () {
            this.sendRemoteCommandToDevice("pause");
        },

        remotePlay: function () {
            this.sendRemoteCommandToDevice("play");
        },

        remoteRewind: function () {
            this.sendRemoteCommandToDevice("rewind");
        },

        remoteFastForward: function () {
            this.sendRemoteCommandToDevice("fastForward");
        },

        remoteInstantReplay: function () {
            this.sendRemoteCommandToDevice("instantReplay");
        },

        remoteQuickSkip: function () {
            this.sendRemoteCommandToDevice("quickSkip");
        },

        remoteStop: function () {
            this.sendRemoteCommandToDevice("stop");
        },

        remoteRecord: function () {
            console.log("remoteRecord invoked");
        },

        recordNow: function () {

            var self = this;
            // load settings from db if not previously loaded
            if (!this.common._settingsRetrieved) {
                var promise = this.common.retrieveSettings();
                promise.then(function() {
                    console.log("invoke executeRecordNow")
                    self.executeRecordNow();
                })
            }
            else {
                this.executeRecordNow();
            }

            return false;
        },

        executeRecordNow: function () {
            // get current date/time - used as title if user doesn't provide one.
            var currentDate = new Date();

            var duration = $("#recordNowDuration").val();
            var inputSource = $("input:radio[name=recordNowInputSource]:checked").val();
            var channel = $("#recordNowChannel").val();
            var scheduledSeriesRecordingId = -1;

            var title = this.common.getRecordingTitle("#recordNowTitle", currentDate, inputSource, channel);

            var aUrl = baseURL + "browserCommand";
            var commandData = { "command": "recordNow", "duration": duration, "title": title, "channel": channel, "inputSource": inputSource, "recordingBitRate": this.common._settings.recordingBitRate, "segmentRecording": this.common._settings.segmentRecordings, "scheduledSeriesRecordingId": scheduledSeriesRecordingId };
            console.log(commandData);

            $.get(aUrl, commandData)
                .done( function (result) {
                    console.log("browserCommand successfully sent");
                })
                .fail( function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always( function () {
                    //alert("recording transmission finished");
                });

            return false;
        },

        createManualRecording: function () {

            // load settings from db if not previously loaded
            if (!this.common._settingsRetrieved) {
                var self = this;
                var promise = this.common.retrieveSettings();
                promise.then(function() {
                    self.executeCreateManualRecording();
                })
            }
            else {
                this.executeCreateManualRecording();
            }
        },

        executeCreateManualRecording: function () {

            // retrieve date/time from html elements and convert to a format that works on all devices
            var date = $("#manualRecordDate").val();
            var time = $("#manualRecordTime").val();
            var dateTimeStr = date + " " + time;

            // required for iOS devices - http://stackoverflow.com/questions/13363673/javascript-date-is-invalid-on-ios
            var compatibleDateTimeStr = dateTimeStr.replace(/-/g, '/');

            var dateObj = new Date(compatibleDateTimeStr);

            var duration = $("#manualRecordDuration").val();
            var inputSource = $("input:radio[name=manualRecordInputSource]:checked").val();
            var channel = $("#manualRecordChannel").val();
            var scheduledSeriesRecordingId = -1;

            // check to see if recording is in the past
            var dtEndOfRecording = this.common.addMinutes(dateObj, duration);
            var now = new Date();

            var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
            if (millisecondsUntilEndOfRecording < 0) {
                alert("Recording time is in the past - change the date/time and try again.");
                return;
            }

            var title = this.common.getRecordingTitle("#manualRecordTitle", dateObj, inputSource, channel);
            var aUrl = baseURL + "browserCommand";
            var commandData = { "command": "manualRecord", "dateTime": compatibleDateTimeStr, "duration": duration, "title": title, "channel": channel, "inputSource": inputSource, "recordingBitRate": this.common._settings.recordingBitRate, "segmentRecording": this.common._settings.segmentRecordings, "scheduledSeriesRecordingId": scheduledSeriesRecordingId,
                "startTimeOffset": 0, "stopTimeOffset": 0 };
            console.log(commandData);

            $.get(aUrl, commandData)
                .done( function (result) {
                    console.log("browserCommand successfully sent");
                })
                .fail( function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always( function () {
                    //alert("recording transmission finished");
                });
        },

        playSelectedShow: function (event) {

            var recordingId = event.data.recordingId;

            // unused?
            //if (recordingId in _currentRecordings) {
            //    var selectedRecording = _currentRecordings[recordingId];
            //}

            var aUrl = baseURL + "browserCommand";
            var commandData = { "command": "playRecordedShow", "recordingId": recordingId };
            console.log(commandData);

            $.get(aUrl, commandData)
                .done( function (result) {
                    console.log("browserCommand successfully sent");
                })
                .fail( function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always( function () {
                    //alert("recording transmission finished");
                });
        },

        deleteSelectedShow: function (event) {
            var recordingId = event.data.recordingId;

            var aUrl = baseURL + "browserCommand";
            var commandData = { "command": "deleteRecordedShow", "recordingId": recordingId };
            console.log(commandData);

            var self = this;
            $.get(aUrl, commandData)
                .done( function (result) {
                    console.log("browserCommand successfully sent");
                    self.common.getRecordedShows();
                })
                .fail( function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("browserCommand failure");
                })
                .always( function () {
                    //alert("recording transmission finished");
                });
        },

        stopActiveRecording: function (event) {

            var scheduledRecordingId = event.data.scheduledRecordingId;

            var aUrl = baseURL + "stopRecording";
            var params = { "scheduledRecordingId": scheduledRecordingId };

            var self = this;
            $.get(aUrl, params)
                .done( function (result) {
                    console.log("stopRecording successful");
                    self.common.getToDoList();
                })
                .fail( function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("stopRecording failure");
                })
                .always( function () {
                    //alert("recording transmission finished");
                });

        },


        deleteScheduledRecordingHandler: function (event) {

            var scheduledRecordingId = event.data.scheduledRecordingId;
            //this.deleteScheduledRecording(scheduledRecordingId, this.common.getToDoList);

            var self = this;
            var promise = this.deleteScheduledRecording(scheduledRecordingId);
            promise.then(function() {
                self.common.getToDoList();
            })
        },


        deleteScheduledRecording: function (scheduledRecordingId) {

            return new Promise(function(resolve, reject) {

                var aUrl = baseURL + "deleteScheduledRecording";
                var commandData = { "scheduledRecordingId": scheduledRecordingId };
                console.log(commandData);

                $.get(aUrl, commandData)
                    .done( function (result) {
                        console.log("deleteScheduledRecording success");
                        resolve();
                    })
                    .fail( function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        reject();
                        console.log("browserCommand failure");
                    })
                    .always( function () {
                        //alert("recording transmission finished");
                    });
                })
        },

        deleteScheduledSeries: function (scheduledSeriesRecordingId) {

            return new Promise(function(resolve, reject) {

                var aUrl = baseURL + "deleteScheduledSeries";
                var commandData = {"scheduledSeriesRecordingId": scheduledSeriesRecordingId};
                console.log(commandData);

                $.get(aUrl, commandData)
                    .done(function (result) {
                        console.log("deleteScheduledSeries success");
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        reject();
                        debugger;
                        console.log("deleteScheduledSeries failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            });
        },

        playSelectedShowFromBeginning: function (event) {
        },

        streamSelectedShow: function (event) {

            var hlsUrl = event.data.hlsUrl;
            if (typeof hlsUrl != "undefined" && hlsUrl != "") {
                var streamingUrl = baseIP + ":8088/file://" + hlsUrl;
                var win = window.open(streamingUrl, '_blank');
                win.focus();
            }
            else {
                alert("Unable to stream this recording.");
            }
        },
    }
});
    