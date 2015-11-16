/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    console.log("creating recordedShowsView module");

    var recordedShowsView = Backbone.View.extend({

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

                var dt = recordedShowModel.attributes.StartDateTime;
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
                var playRecordingId = "recording" + recordedShowModel.get('RecordingId').toString();
                var deleteRecordingId = "delete" + recordedShowModel.get('RecordingId').toString();

                var recordedShowAttributes = {};
                recordedShowAttributes.PlayRecordingId = playRecordingId;
                recordedShowAttributes.DeleteRecordingId = deleteRecordingId;
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


    });

    return recordedShowsView;
});
