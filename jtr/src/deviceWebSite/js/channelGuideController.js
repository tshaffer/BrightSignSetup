/**
 * Created by tedshaffer on 11/6/15.
 */
define(['stationsModel', 'channelGuideModel','channelGuideView','cgPopupView'], function (StationsModel, ChannelGuideModel, ChannelGuideView, CGPopUpView) {

    console.log("creating channelGuideController module");

    var channelGuideController = {

        appController: null,

        channelGuideModel: null,
        channelGuideView: null,
        cgPopupView: null,
        stationsModel: null,
        retrieveStationsPromise: null,
        channelGuideRetrieveEpgDataPromise: null,

        init: function() {

            this.stationsModel = StationsModel.getInstance();

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

            this.listenTo(this.channelGuideView, "invokeHome", function() {
                console.log("channelGuideController:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });
        },

        retrieveData: function() {
            // retrieve epg data and stations
            var self = this;

            this.retrieveStationsPromise = this.stationsModel.retrieveStations();
            this.channelGuideRetrieveEpgDataPromise = this.channelGuideModel.retrieveEpgData();
        },

        show: function() {
            console.log("channelGuideController:show() invoked");

            // retrieve epg data from the server
            var self = this;

            if (this.channelGuideRetrieveEpgDataPromise != null && this.retrieveStationsPromise != null) {
                Promise.all([this.retrieveStationsPromise, this.channelGuideRetrieveEpgDataPromise]).then(function() {
                    self.channelGuideView.stations = self.stationsModel.getStations();
                    self.cgPopupView.stations = self.stationsModel.getStations();
                    self.channelGuideView.show();
                });
            }
        },

        getStationsModel: function() {
            return this.stationsModel;
        },

        setAppController: function(appController) {
            this.appController = appController;

            this.listenTo(this.appController, "remoteCommand", function(targetPage, remoteCommand) {
                if (targetPage == "channelGuidePage") {
                    console.log("channelGuideController: remoteCommand received.");
                    this.channelGuideView.executeRemoteCommand(remoteCommand);
                }
            });
        }
    };

    channelGuideController.init();
    return channelGuideController;
});
