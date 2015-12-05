/**
 * Created by tedshaffer on 12/5/15.
 */
define(function () {

    console.log("creating footerController module");

    var footerController = {

        init: function() {

            _.extend(this, Backbone.Events);
        },

        show: function() {
            console.log("deviceWebSite::footerController:show() invoked");
        },
    };

    footerController.init();
    return footerController;
});
