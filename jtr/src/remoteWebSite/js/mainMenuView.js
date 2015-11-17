/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    console.log("creating MainMenuView module");

    var MainMenuView = Backbone.View.extend({

        initialize: function () {
            console.log("MainMenuView::initialize");

            this.template = _.template($('#homePageTemplate').html());
        },

        events: {
            "click #recordedShows": "recordedShowsHandler",
            "click #manualRecord": "manualRecordHandler",
            "click #channelGuideId": "channelGuideHandler",
            "click #scheduledRecordings": "scheduledRecordingsHandler",
            "click #settings": "settingsHandler"
        },

        recordedShowsHandler: function (event) {
            // Button clicked, you can access the element that was clicked with event.currentTarget
            console.log("recordedShowsHandler, trigger invokeRecordedShows");
            // broadcast event - only goes to those objects specifically listening to MainMenuView
            this.trigger("invokeRecordedShows");
        },

        manualRecordHandler: function (event) {
            console.log("manualRecordHandler, trigger invokeManualRecord");
            this.trigger("invokeManualRecord");
        },

        channelGuideHandler: function (event) {
            console.log("channelGuideHandler, trigger invokeChannelGuide");
            this.trigger("invokeChannelGuide");
        },

        scheduledRecordingsHandler: function (event) {
            console.log("scheduledRecordingsHandler, trigger invokeScheduledRecordings");
            this.trigger("invokeScheduledRecordings");
        },

        settingsHandler: function (event) {
            console.log("settingsHandler, trigger invokeSettings");
            this.trigger("invokeSettings");
        },

        show: function() {
            this.render();
        },

        render: function () {
            console.log("MainMenuView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            $("#homePage").css("display", "block");

            return this;
        },

        pizzaTest: "pizza"
    });

    return MainMenuView;
});
