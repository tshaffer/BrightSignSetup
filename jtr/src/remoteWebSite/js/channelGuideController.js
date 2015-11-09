/**
 * Created by tedshaffer on 11/6/15.
 */
define(['stationsModel', 'channelGuideModel','channelGuideView'], function (StationsModel, ChannelGuideModel, ChannelGuideView) {

    var channelGuideController = {

        channelGuideModel: null,
        channelGuideView: null,

        setServerInterface: function(serverInterface) {
            this.channelGuideModel.setServerInterface(serverInterface);
            this.channelGuideView.setServerInterface(serverInterface);
            this.stationsModel.setServerInterface(serverInterface);
        },

        init: function() {

            this.stationsModel = new StationsModel({});

            this.channelGuideModel = new ChannelGuideModel({
            });
            this.channelGuideModel.init();

            // JOEL-HELP!
            this.channelGuideView = new ChannelGuideView({
                el: $("#channelGuidePage"),
                model: this.channelGuideModel,
                //stationsModel: this.stationsModel - why didn't this work?
            });
            this.channelGuideView.stationsModel = this.stationsModel;

            _.extend(this, Backbone.Events);
        },

        retrieveData: function() {
            // retrieve epg data and stations
            var self = this;
            var promise = this.stationsModel.retrieveStations();
            promise.then(function() {
                self.channelGuideView.stations = self.stationsModel.getStations();
                var channelGuideModelPromise = self.channelGuideModel.retrieveEpgData();
            })
        },

        show: function() {
            console.log("channelGuideController:show() invoked");

            // retrieve epg data from the server
            var self = this;

            //// promise should be retrieved; continue on after promise is resolved
            //this.stationsModel.retrieveStations();
            //
            //// promise should be retrieved; continue on after promise is resolved
            //this.channelGuideModel.retrieveEpgData();

            // after the line above is really done
             self.channelGuideView.show();

        },

        pizza: "pizza"
    };

    channelGuideController.init();
    return channelGuideController;
});
