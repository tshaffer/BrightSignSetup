/**
 * Created by tedshaffer on 11/6/15.
 */
define(['stationsModel', 'channelGuideModel','channelGuideView','cgPopupView'], function (StationsModel, ChannelGuideModel, ChannelGuideView, CGPopUpView) {

    console.log("creating channelGuideController module");

    var channelGuideController = {

        channelGuideModel: null,
        channelGuideView: null,
        cgPopupView: null,
        stationsModel: null,

        init: function() {

            this.stationsModel = StationsModel.getInstance();
            //this.stationsModel = new StationsModel({});

            this.channelGuideModel = new ChannelGuideModel({
            });
            this.channelGuideModel.init();

            this.channelGuideView = new ChannelGuideView({
                el: $("#channelGuidePage"),
                model: this.channelGuideModel,
                stationsModel: this.stationsModel
            });

            this.cgPopupView = new CGPopUpView({
                model: this.channelGuideModel,
            });
            this.cgPopupView.stationsModel = this.stationsModel;

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.channelGuideView, "displayCGPopup", function(programData) {
                console.log("ChannelGuideController:: displayCGPopup event received");
                self.cgPopupView.show(programData);
                return false;
            });

            this.listenTo(this.cgPopupView, "cgPopupViewExit", function() {
                console.log("cgPopupView:: cgPopupViewExit event received");
                self.channelGuideView.reselectProgram();
                return false;
            });

        },

        // joelnotes
        // show should have a .then on the channelGuideModelPromise before invoking show on channelGuideView


        retrieveData: function() {
            // retrieve epg data and stations
            var self = this;
            var promise = this.stationsModel.retrieveStations();
            promise.then(function() {
                self.channelGuideView.stations = self.stationsModel.getStations();
                self.cgPopupView.stations = self.stationsModel.getStations();
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

        getStationsModel: function() {
            return this.stationsModel;
        },

        pizza: "pizza"
    };

    channelGuideController.init();
    return channelGuideController;
});
