/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    console.log("creating mainMenuView module");

    var mainMenuView = Backbone.View.extend({

        initialize: function () {
            console.log("mainMenuView::initialize");

            this.template = _.template($('#homePageTemplate').html());
        },

        events: {
            "click #recordedShows": "recordedShowsHandler",
            "click #manualRecord": "manualRecordHandler",
            "click #channelGuideId": "channelGuideHandler",
            "click #scheduledRecordings": "scheduledRecordingsHandler"
        },

        recordedShowsHandler: function (event) {
            // Button clicked, you can access the element that was clicked with event.currentTarget
            console.log("recordedShowsHandler, trigger invokeRecordedShows");
            // broadcast event - only goes to those objects specifically listening to mainMenuView
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


    // at this point, mainMenuView.pizzaTest is undefined
    //var foo = new mainMenuView();
    // at this point, foo.pizzaTest is valid
    // implication of this is that 'new' needs to be invoked on mainMenuView.

    return mainMenuView;
});
