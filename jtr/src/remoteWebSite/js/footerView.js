/**
 * Created by tedshaffer on 11/15/15.
 */
define(function () {

    console.log("creating FooterView module");

    var FooterView = Backbone.View.extend({

        initialize: function () {
            console.log("FooterView::initialize");
            this.template = _.template($('#footerTemplate').html());
        },

        show: function() {
            this.render();
        },

        render: function () {
            console.log("FooterView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            $("#FooterView").css("display", "block");
            
            return this;
        },

        events: {
            "click #btnHome": "invokeHomeHandler",
            "click #btnRemoteRecord": "invokeRemoteHandler",
            "click #btnRemoteStop": "invokeRemoteHandler",
            "click #btnRemoteRewind": "invokeRemoteHandler",
            "click #btnRemoteInstantReplay": "invokeRemoteHandler",
            "click #btnRemotePause": "invokeRemoteHandler",
            "click #btnRemotePlay": "invokeRemoteHandler",
            "click #btnRemoteQuickSkip": "invokeRemoteHandler",
            "click #btnRemoteFastForward": "invokeRemoteHandler",
        },

        invokeHomeHandler: function(event) {
            console.log("FooterView::invokeHomeHandler invoked");
            this.trigger("invokeHome");
            return false;
        },

        invokeRemoteHandler: function(event) {
            console.log("invokeRemoteHandler - action=" + event.target.id);
            this.trigger("invokeRemote", event.target.id);
            return false;
        }

    });

    return FooterView;
});
