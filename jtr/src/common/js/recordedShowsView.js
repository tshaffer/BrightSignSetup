/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    console.log("creating RecordedShowsView module");

    var RecordedShowsView = Backbone.View.extend({

        el: '#recordedShowsPage',

        recordedPageIds: [],

        initialize: function () {
        },

        show: function() {
            this.render();
        },

        render: function() {

            var self = this;

            this.$el.html('');

            // Grab the template script
            var theTemplateScript = $("#recordedShowTemplate").html();

            // Compile the template
            var theTemplate = Handlebars.compile(theTemplateScript);

            // Create the context for recorded shows
            var recordedShowsAttributes = [];
            var recordingIds = [];

            this.recordedPageIds = [];


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

                var recordingId = recordedShowModel.get('RecordingId');
                recordingIds.push(recordingId);

                // IDs
                var recordingIdStr = recordingId.toString();
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

                var recordedPageRow = [];
                recordedPageRow.push("#" + playRecordingId);
                recordedPageRow.push("#" + deleteRecordingId);
                self.recordedPageIds.push(recordedPageRow);

                //// play from beginning
                //var btnIdPlayFromBeginning = "#repeat" + recordingId;
                //
                //// stream a recording
                //var btnIdStream = "#stream" + recordingId;
                //
                //// highlight the last selected show
                //if (recordingId == lastSelectedShowId) {
                //    focusApplied = true;
                //    $(btnIdRecording).focus();
                //}
                //
            });
            var context = {
                recordedShows : recordedShowsAttributes
            };

            // Pass our data to the template
            var theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            $("#recordedShowsTableBody").append(theCompiledHtml);

            $.each(recordingIds, function (index, recordingId) {
                var btnIdPlayRecording = "#recording" + recordingId;
                $(btnIdPlayRecording).click({ recordingId: recordingId }, function (event) {
                    self.trigger("playSelectedShow", event.data.recordingId);
                });

                var btnIdDeleteRecording = "#delete" + recordingId;
                $(btnIdDeleteRecording).click({ recordingId: recordingId }, function (event) {
                    self.trigger("deleteSelectedShow", event.data.recordingId);
                });

                $(btnIdPlayRecording).keydown(function (keyEvent) {

                    var keyCode = keyEvent.which;
                    if (typeof keyCode != "undefined") {
                        if (keyCode == "exit") {
                            self.trigger("eraseUI");
                            return true;
                        }
                        else
                        {
                            return self.navigate(keyCode);
                        }
                    }
                    return false;
                    // not handling enter / select yet
                });

                $(btnIdDeleteRecording).keydown(function (keyEvent) {
                    var keyCode = keyEvent.which;
                    if (typeof keyCode != "undefined") {
                        if (keyCode == "exit") {
                            self.trigger("eraseUI");
                            return true;
                        }
                        else
                        {
                            return self.navigate(keyCode);
                        }
                    }
                    return false;
                    // not handling enter / select yet
                });

            });

            $("#recordedShowsPage").css("display", "block");

            // will fail if there are no recordings
            $(this.recordedPageIds[0][0]).focus();

            return this;
        },

        navigate: function (command) {

                console.log("navigateRecordedShowsPage entry");

                var rowIndex = -1;
                var colIndex = -1;

                var currentElement = document.activeElement;
                var currentElementId = currentElement.id;

                if (currentElementId == "" || currentElementId == "recordedShows") {
                    rowIndex = 0;
                    colIndex = 0;
                }
                else {
                    currentElementId = "#" + currentElementId;
                    for (var i = 0; i < this.recordedPageIds.length; i++) {

                        var recordingId = this.recordedPageIds[i][0];
                        var deleteId = this.recordedPageIds[i][1];

                        if (recordingId == currentElementId) {
                            rowIndex = i;
                            colIndex = 0;
                            break;
                        }
                        else if (deleteId == currentElementId) {
                            rowIndex = i;
                            colIndex = 1;
                            break;
                        }
                    }

                    switch (command) {
                        case constants.KEY_UP:
                            if (rowIndex > 0) rowIndex--;
                            break;
                        case constants.KEY_DOWN:
                            if (rowIndex < this.recordedPageIds.length) rowIndex++;
                            break;
                        case constants.KEY_LEFT:
                            if (colIndex > 0) colIndex--;
                            break;
                        case constants.KEY_RIGHT:
                            if (colIndex < 1) colIndex++;
                            break;
                        default:
                            return false;
                    }
                }

                $(this.recordedPageIds[rowIndex][colIndex]).focus();

                return true;
            }

        });

    return RecordedShowsView;
});
