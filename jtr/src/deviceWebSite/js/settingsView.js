/**
 * Created by tedshaffer on 11/17/15.
 */
define(function () {

    console.log("creating SettingsView module");

    var SettingsView = Backbone.View.extend({

        initialize: function () {
            console.log("SettingsView::initialize");
        },

        show: function() {
            this.render();
        },

        render: function () {

            console.log("SettingsView::render");

            this.$el.html('');

            // Grab the template script
            var theTemplateScript = $("#settingsTemplate").html();

            // Compile the template
            var theTemplate = Handlebars.compile(theTemplateScript);

            var checkLow = "";
            var checkMedium = "";
            var checkHigh = "";

            switch (this.model.get("RecordingBitRate")) {
                case 4:
                    checkLow = "checked";
                    break;
                case 6:
                    checkMedium = "checked";
                    break;
                case 10:
                    checkHigh = "checked";
                    break;
            }

            var checkSegmentRecordings = "";
            if (this.model.get('SegmentRecordings') != 0) {
                checkSegmentRecordings = "checked";
            }
            var context = {
                lowChecked : checkLow,
                mediumChecked : checkMedium,
                highChecked: checkHigh,
                segmentRecordings: checkSegmentRecordings
            };

            // Pass our data to the template
            var theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            $("#settingsPage").append(theCompiledHtml);


            $("#settingsPage").css("display", "block");

            // handlers
            var self = this;
            $("#recordingQualityLow").change(function () {
                self.model.setRecordingBitRate(4);
            });

            $("#recordingQualityMedium").change(function () {
                self.model.setRecordingBitRate(6);
            });

            $("#recordingQualityHigh").change(function () {
                self.model.setRecordingBitRate(10);
            });

            $("#segmentRecordingsCheckBox").change(function() {
                var segmentRecordings = $("#segmentRecordingsCheckBox").is(':checked')
                if (segmentRecordings) {
                    self.model.setSegmentRecordings(1);
                }
                else {
                    self.model.setSegmentRecordings(0);
                }
            });
            return this;
        },

        executeRemoteCommand: function(remoteCommand) {
            console.log("settingsView:executeRemoteCommand:" + remoteCommand);

            switch (remoteCommand) {
                case "MENU":
                    console.log("settingsView::invokeHomeHandler invoked");
                    this.trigger("invokeHome");
                    break;
                case "UP":
                case "DOWN":
                case "LEFT":
                case "RIGHT":
                    //this.navigate(remoteCommand);
                    break;
                case "SELECT":
                    //this.select(remoteCommand);
                    break;
            }
        },
    });

    return SettingsView;
});
