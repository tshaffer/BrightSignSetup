/**
 * Created by tedshaffer on 11/6/15.
 */
define(['stationsModel', 'channelGuideModel','channelGuideView'], function (StationsModel, ChannelGuideModel, ChannelGuideView) {

    var channelGuideController = {

        channelGuideModel: null,
        channelGuideView: null,

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
            this.channelGuideView.stations = this.stationsModel.stations;

            _.extend(this, Backbone.Events);

            // retrieve epg data and stations
            // promise should be retrieved; continue on after promise is resolved
            this.stationsModel.retrieveStations();

            // promise should be retrieved; continue on after promise is resolved
            this.channelGuideModel.retrieveEpgData();
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
