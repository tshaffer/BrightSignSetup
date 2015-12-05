/**
 * Created by tedshaffer on 11/8/15.
 */
define(function () {

    console.log("creating serverInterface module");

    var serverInterface = {

        //baseURL : "http://192.168.0.108:8080/",
        //baseURL : "http://10.1.0.241:8080/",
        baseURL: "http://localHost:8080/",

        lastTunedChannelResult: null,

        setBaseURL: function(baseURL) {
            this.baseURL = baseURL;
        },

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

            var aUrl = this.baseURL + "deleteScheduledRecording";
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
                        console.log("deleteScheduledRecording failure");
                    })
                    .always( function () {
                        //alert("recording transmission finished");
                    });
            })
        },

        stopActiveRecording: function (scheduledRecordingId) {

            var aUrl = this.baseURL + "stopRecording";
            var commandData = { "scheduledRecordingId": scheduledRecordingId };

            return new Promise(function(resolve, reject) {

                $.get(aUrl, commandData)
                    .done( function (result) {
                        console.log("stopRecording success");
                        resolve();
                    })
                    .fail( function (jqXHR, textStatus, errorThrown) {
                        debugger;
                        reject();
                        console.log("stopRecording failure");
                    })
                    .always( function () {
                        //alert("recording transmission finished");
                    });
            })

            //var self = this;
            //$.get(aUrl, params)
            //    .done( function (result) {
            //        console.log("stopRecording successful");
            //        self.common.getToDoList();
            //    })
            //    .fail( function (jqXHR, textStatus, errorThrown) {
            //        debugger;
            //        console.log("stopRecording failure");
            //    })
            //    .always( function () {
            //        //alert("recording transmission finished");
            //    });

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
    };

    //serverInterface.init();
    return serverInterface;
})