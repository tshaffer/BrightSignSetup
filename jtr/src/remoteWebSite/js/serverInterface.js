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
        }
    };

    //serverInterface.init();
    return serverInterface;
})