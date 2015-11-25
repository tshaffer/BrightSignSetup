/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    console.log("creating RecordedShowsView module");

    var RecordedShowsView = Backbone.View.extend({

        el: '#recordedShowsPage',

        initialize: function () {
        },

        show: function() {
            this.render();
        },

        render: function() {
            this.$el.html('');

            // Grab the template script
            var theTemplateScript = $("#recordedShowTemplate").html();

            // Compile the template
            var theTemplate = Handlebars.compile(theTemplateScript);

            // Create the context for recorded shows
            var recordedShowsAttributes = [];
            var recordingIds = [];
            this.model.each(function(recordedShowModel) {

                // TITLE
                var title = recordedShowModel.attributes.Title;

                // RECORDING DATE
                var weekday = new Array(7);
                weekday[0] = "Sun";
                weekday[1] = "Mon";
                weekday[2] = "Tue";
                weekday[3] = "Wed";
                weekday[4] = "Thu";
                weekday[5] = "Fri";
                weekday[6] = "Sat";

                var dt = recordedShowModel.get('StartDateTime');
                var n = dt.indexOf(".");
                var formattedDayDate;
                if (n >= 0) {
                    var dtCompatible = dt.substring(0, n);
                    var date = new Date(dtCompatible);
                    formattedDayDate = weekday[date.getDay()] + " " + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
                }
                else {
                    formattedDayDate = "poop";
                }

                // POSITION
                var lastViewedPositionInMinutes = Math.floor(recordedShowModel.get('LastViewedPosition') / 60);
                var position = lastViewedPositionInMinutes.toString() + " of " + recordedShowModel.get('Duration').toString() + " minutes";

                // IDs
                var recordingIdStr = recordedShowModel.get('RecordingId').toString();
                var playRecordingId = "recording" + recordingIdStr;
                var deleteRecordingId = "delete" + recordingIdStr;
                var repeatRecordingId = "repeat" + recordingIdStr;
                var streamRecordingId = "stream" + recordingIdStr;
                var infoRecordingId = "info" + recordingIdStr;
                var recordingPath = recordedShowModel.get('Path');

                var recordedShowAttributes = {};
                recordedShowAttributes.PlayRecordingId = playRecordingId;
                recordedShowAttributes.DeleteRecordingId = deleteRecordingId;
                recordedShowAttributes.RepeatRecordingId = repeatRecordingId;
                recordedShowAttributes.StreamRecordingId = streamRecordingId;
                recordedShowAttributes.InfoRecordingId = infoRecordingId;
                recordedShowAttributes.RecordingPath = recordingPath;
                recordedShowAttributes.Title = title;
                recordedShowAttributes.StartDateTime = formattedDayDate;
                recordedShowAttributes.Position = position;

                recordedShowsAttributes.push(recordedShowAttributes);

                recordingIds.push(recordedShowModel.get('RecordingId'));
            });
            var context = {
                recordedShows : recordedShowsAttributes
            };

            // Pass our data to the template
            var theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            $("#recordedShowsTableBody").append(theCompiledHtml);

            var self = this;
            $.each(recordingIds, function (index, recordingId) {
                var btnIdPlayRecording = "#recording" + recordingId;
                $(btnIdPlayRecording).click({ recordingId: recordingId }, function (event) {
                    //self.playSelectedShowCallback(event);
                    self.trigger("playSelectedShow", event.data.recordingId);
                });

                var btnIdDeleteRecording = "#delete" + recordingId;
                $(btnIdDeleteRecording).click({ recordingId: recordingId }, function (event) {
                    self.trigger("deleteSelectedShow", event.data.recordingId);
                });
            });

            $("#recordedShowsPage").css("display", "block");

            return this;
        },

        //playSelectedShowCallback: function(event) {
        //    console.log("playback recording with id = " + event.data.recordingId);
        //}

        executeRemoteCommand: function(remoteCommand) {
            console.log("recordedShowsView:executeRemoteCommand:" + remoteCommand);

            switch (remoteCommand) {
                case "MENU":
                    console.log("recordedShowsView::invokeHomeHandler invoked");
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

    return RecordedShowsView;
});
