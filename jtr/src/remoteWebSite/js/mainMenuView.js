/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var mainMenuView = Backbone.View.extend({

            initialize: function () {
                console.log("mainMenuView::initialize");

                // JTRTODO - load template here. add render function. possibly call it here or later.
            },

            events: {
                "click #recordedShows": "recordedShowsHandler",
                "click #manualRecord": "manualRecordHandler"
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

            pizzaTest: "pizza"
        });


    // at this point, mainMenuView.pizzaTest is undefined
    //var foo = new mainMenuView();
    // at this point, foo.pizzaTest is valid
    // implication of this is that 'new' needs to be invoked on mainMenuView.

    return mainMenuView;
});
