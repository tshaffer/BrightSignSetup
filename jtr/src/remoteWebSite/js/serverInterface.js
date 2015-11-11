/**
 * Created by tedshaffer on 11/8/15.
 */
define(function () {

    var serverInterface = {

        //baseURL : "http://192.168.2.8:8080/",
        baseURL : "http://10.1.0.241:8080/",

        lastTunedChannelResult: null,

        getBaseUrl: function() {
            return this.baseURL;
        },

        browserCommand: function(commandData) {

            var url = this.baseURL + "browserCommand";

            return new Promise(function(resolve, reject) {
                $.get(url, commandData)
                    .done(function (result) {
                        console.log("browserCommand successfully sent");
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        reject();
                        debugger;
                        console.log("browserCommand failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            })
        },

        retrieveLastTunedChannel:  function () {

            var self = this;
            var url = this.baseURL + "lastTunedChannel";

            return new Promise(function(resolve, reject) {

                var mySelf = self;

                $.get(url)
                    .done(function (result) {
                        console.log("serverInterface::lastTunedChannel successfully retrieved");
                        self.lastTunedChannelResult = result;
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        reject();
                        debugger;
                        console.log("lastTunedChannel failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            })
        },


        getLastTunedChannel: function() {
            return this.lastTunedChannelResult;
        },

        retrieveScheduledRecordings: function () {

            var self = this;
            var aUrl = this.baseURL + "getScheduledRecordings";

            return new Promise(function (resolve, reject) {

                var currentDateTimeIso = new Date().toISOString();
                var currentDateTime = {"currentDateTime": currentDateTimeIso};

                $.get(aUrl, currentDateTime)
                    .done(function (scheduledRecordings) {
                        console.log("retrieveScheduledRecordings: getScheduledRecordings processing complete");
                        self.scheduledRecordings = [];
                        $.each(scheduledRecordings, function (index, scheduledRecording) {
                            self.scheduledRecordings.push(scheduledRecording);
                        });
                        resolve();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        reject();
                        debugger;
                        console.log("getScheduledRecordings failure");
                    })
                    .always(function () {
                        //alert("recording transmission finished");
                    });
            });
        },

        getScheduledRecordings: function() {
            return this.scheduledRecordings;
        },

        deleteScheduledRecording: function (scheduledRecordingId) {

            var aUrl = baseURL + "deleteScheduledRecording";
            var commandData = { "scheduledRecordingId": scheduledRecordingId };

            return new Promise(function(resolve, reject) {

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

            var aUrl = baseURL + "deleteScheduledSeries";
            var commandData = {"scheduledSeriesRecordingId": scheduledSeriesRecordingId};

            return new Promise(function(resolve, reject) {

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

        retrieveSettings: function () {

            var aUrl = this.baseURL + "getSettings";

            var self = this;

            return new Promise(function(resolve, reject) {

                // get settings from db
                $.get(aUrl, {})
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

        getSettings: function() {
            return this._settings;
        }
    };

    //serverInterface.init();
    return serverInterface;
})