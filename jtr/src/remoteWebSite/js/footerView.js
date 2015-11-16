/**
 * Created by tedshaffer on 11/15/15.
 */
define(function () {

    console.log("creating footerView module");

    var footerView = Backbone.View.extend({

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

            // handlers
            //var self = this;
            //$("#rbManualRecordTuner").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", true);
            //});
            //
            //$("#rbManualRecordRoku").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", false);
            //});
            //
            //$("#rbManualRecordTivo").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", false);
            //});

            $("#footerView").css("display", "block");

            var self = this;

            //$("#btnHome").click(function() {
            //    console.log("footerView::btnHome clicked");
            //    self.trigger("invokeHome");
            //    return false;
            //})
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
            console.log("footerView::invokeHomHandler invoked");
            this.trigger("invokeHome");
            return false;
        },

        invokeRemoteHandler: function(event) {
            console.log("invokeRemoteHandler - action=" + event.target.id);
            this.trigger("invokeRemote", event.target.id);
            return false;
        }

    });

    return footerView;
});
