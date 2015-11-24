/**
 * Created by tedshaffer on 11/15/15.
 */
define(['footerView'], function (FooterView) {

    console.log("creating footerController module");

    var footerController = {

        FooterView: null,

        init: function() {

            this.FooterView = new FooterView({
                el: $("#footerContainer"),
            });

            _.extend(this, Backbone.Events);

            var self = this;

            this.listenTo(this.FooterView, "invokeHome", function() {
                console.log("FooterController:: invokeHome event received");
                self.trigger("invokeHome");
                return false;
            });

            this.listenTo(this.FooterView, "invokeRemote", function(id) {
                console.log("FooterController:: invokeRemote event received, id=" + id);
                self.trigger("invokeRemote", id);
                return false;
            });
        },

        show: function() {
            console.log("footerController:show() invoked");
            this.FooterView.show();
        },
    };

    footerController.init();
    return footerController;
});
