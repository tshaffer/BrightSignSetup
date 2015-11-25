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
                    //self.playSelectedShowCallback(event);
                    self.trigger("playSelectedShow", event.data.recordingId);
                });

                var btnIdDeleteRecording = "#delete" + recordingId;
                $(btnIdDeleteRecording).click({ recordingId: recordingId }, function (event) {
                    self.trigger("deleteSelectedShow", event.data.recordingId);
                });
            });

            $("#recordedShowsPage").css("display", "block");

            // will fail if there are no recordings
            $(this.recordedPageIds[0][0]).focus();

            return this;
        },

        //playSelectedShowCallback: function(event) {
        //    console.log("playback recording with id = " + event.data.recordingId);
        //}

        executeRemoteCommand: function(command) {
            console.log("recordedShowsView:executeRemoteCommand:" + command);

            switch (command.toLowerCase()) {
                case "menu":
                    console.log("recordedShowsView::invokeHomeHandler invoked");
                    this.trigger("invokeHome");
                    break;
                case "up":
                case "down":
                case "left":
                case "right":
                    this.navigate(command.toLowerCase());
                    break;
                case "select":
                    this.select(command);
                    break;
            }
        },

        select: function (command) {

            var currentElement = document.activeElement;
            var currentElementId = currentElement.id;
            console.log("active recorded shows page item is " + currentElementId);

            var action = this.getAction(currentElementId);
            if (action != "") {
                var recordingId = currentElementId.substring(action.length);
                switch (action) {
                    case "recording":
                        this.trigger("playSelectedShow", recordingId);
                        this.trigger("eraseUI");
                        break;
                    case "delete":
                        this.trigger("deleteSelectedShow", recordingId);
                        break;
                }
            }

        },

        getAction : function (actionButtonId) {

            if (actionButtonId.lastIndexOf("recording") === 0) {
                return "recording";
            }
            else if (actionButtonId.lastIndexOf("delete") === 0) {
                return "delete";
            }
            console.log("getAction - no matching action found for " + actionButtonId);
            return "";
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
                    for (i = 0; i < this.recordedPageIds.length; i++) {

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
                        case "up":
                            if (rowIndex > 0) rowIndex--;
                            break;
                        case "down":
                            if (rowIndex < this.recordedPageIds.length) rowIndex++;
                            break;
                        case "left":
                            if (colIndex > 0) colIndex--;
                            break;
                        case "right":
                            if (colIndex < 1) colIndex++;
                            break;
                    }
                }

                $(this.recordedPageIds[rowIndex][colIndex]).focus();
            }

        });

    return RecordedShowsView;
});
