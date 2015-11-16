/**
 * Created by tedshaffer on 11/14/15.
 */
define(['stationsModel'], function (StationsModel) {

        console.log("creating ScheduledRecordingsView module");

        var ScheduledRecordingsView = Backbone.View.extend({

            settingsModel: null,

            el: '#scheduledRecordingsPage',

            initialize: function () {
            },

            show: function() {
                this.render();
            },

            render: function() {
                this.$el.html('');

                // Grab the template script
                var theTemplateScript = $("#scheduledRecordingTemplate").html();

                // Compile the template
                var theTemplate = Handlebars.compile(theTemplateScript);

                // Create the context for scheduled recordings
                var scheduledRecordingsAttributes = [];
                var scheduledRecordingIds = [];

                var self = this;

                this.model.each(function(scheduledRecordingModel) {

                    /*
                     Delete / Stop icon
                     DayOfWeek
                     Date
                     Time
                     Channel
                     Station Name
                     Title
                     */

                    var weekday = new Array(7);
                    weekday[0] = "Sun";
                    weekday[1] = "Mon";
                    weekday[2] = "Tue";
                    weekday[3] = "Wed";
                    weekday[4] = "Thu";
                    weekday[5] = "Fri";
                    weekday[6] = "Sat";

                    var currentDateTime = new Date();
                    var date = new Date(scheduledRecordingModel.get('DateTime'));
                    var endDateTime = new Date(scheduledRecordingModel.get('EndDateTime'));

                    var clickAction = "delete";
                    var icon = 'glyphicon-remove';
                    if (date <= currentDateTime && currentDateTime < endDateTime) {
                        clickAction = "stop";
                        icon = 'glyphicon-stop';
                    }

                    var dayOfWeek = weekday[date.getDay()];

                    var monthDay = (date.getMonth() + 1).toString() + "/" + date.getDate().toString();

                    var amPM = "am";

                    var numHours = date.getHours();
                    if (numHours == 0)
                    {
                        numHours = 12;
                    }
                    else if (numHours > 12) {
                        numHours -= 12;
                        amPM = "pm";
                    }
                    else if (numHours == 12) {
                        amPM = "pm";
                    }
                    var hoursLbl = numHours.toString();

                    // JTRTODO - Backbone - need to investigate
                    //if (hoursLbl.length == 1) hoursLbl = "&nbsp" + hoursLbl;
                    if (hoursLbl.length == 1) hoursLbl = hoursLbl;

                    var minutesLbl = twoDigitFormat(date.getMinutes().toString());

                    var timeOfDay = hoursLbl + ":" + minutesLbl + amPM;

                    var channel = scheduledRecordingModel.get('Channel');
                    var channelParts = channel.split('-');
                    if (channelParts.length == 2 && channelParts[1] == "1") {
                        channel = channelParts[0];
                    }

                    self.stationsModel = StationsModel.getInstance();
                    var stations = self.stationsModel.getStations();
                    var station = self.stationsModel.getStationFromAtsc(channelParts[0], channelParts[1]);

                    var stationName = "TBD";
                    if (station != null) {
                        stationName = station.CommonName;
                    }

                    var title = scheduledRecordingModel.get('Title');

                    var id = scheduledRecordingModel.get('Id');

                    var scheduledRecordingAttributes = {};
                    scheduledRecordingAttributes.DayOfWeek = dayOfWeek;
                    scheduledRecordingAttributes.MonthDay = monthDay;
                    scheduledRecordingAttributes.TimeOfDay = timeOfDay;
                    scheduledRecordingAttributes.Channel = channel;
                    scheduledRecordingAttributes.StationName = stationName;
                    scheduledRecordingAttributes.Title = title;
                    scheduledRecordingAttributes.Id = clickAction + id;
                    scheduledRecordingAttributes.Icon = icon;

                    scheduledRecordingsAttributes.push(scheduledRecordingAttributes);
                    scheduledRecordingIds.push(id);
                });
                var context = {
                    scheduledRecordings : scheduledRecordingsAttributes
                };

                // Pass our data to the template
                var theCompiledHtml = theTemplate(context);

                // Add the compiled html to the page
                $("#scheduledRecordingsTableBody").append(theCompiledHtml);

                //var self = this;
                //$.each(recordingIds, function (index, recordingId) {
                //
                //    var btnIdDeleteRecording = "#delete" + recordingId;
                //    $(btnIdDeleteRecording).click({ recordingId: recordingId }, function (event) {
                //        self.trigger("deleteSelectedShow", event.data.recordingId);
                //    });
                //});

                for (var i = 0; i < scheduledRecordingIds.length; i++) {

                    var scheduledRecordingId = scheduledRecordingIds[i].toString();

                    // only one of the next two handlers can be invoked - that is, either btnIdStop or btnIdDelete exists

                    // stop an active recording
                    var btnIdStop = "#stop" + scheduledRecordingId;
                    $(btnIdStop).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                        //self.browser.stopActiveRecording(event);
                        self.trigger("stopActiveRecording", scheduledRecordingId);
                    });

                    // delete a scheduled recording
                    var btnIdDelete = "#delete" + scheduledRecordingId;
                    $(btnIdDelete).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                        self.trigger("deleteScheduledRecording", scheduledRecordingId);
                    });

                }

                //self.scheduledRecordingIds.length = 0;
                //
                //// add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                //$.each(scheduledRecordings, function (index, scheduledRecording) {
                //
                //    var scheduledRecordingId = scheduledRecording.Id;
                //
                //    // only one of the next two handlers can be invoked - that is, either btnIdStop or btnIdDelete exists
                //
                //    // stop an active recording
                //    var btnIdStop = "#stop" + scheduledRecordingId;
                //    $(btnIdStop).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                //        self.browser.stopActiveRecording(event);
                //    });
                //
                //    // delete a scheduled recording
                //    var btnIdDelete = "#delete" + scheduledRecordingId;
                //    $(btnIdDelete).click({ scheduledRecordingId: scheduledRecordingId }, function (event) {
                //        self.browser.deleteScheduledRecordingHandler(event);
                //    });
                //
                //    var scheduledRecordingRow = [];
                //    scheduledRecordingRow.push(btnIdDelete);
                //    self.scheduledRecordingIds.push(scheduledRecordingRow);
                //});



                $("#scheduledRecordingsPage").css("display", "block");

                return this;
            },

            //playSelectedShowCallback: function(event) {
            //    console.log("playback recording with id = " + event.data.recordingId);
            //}

        });

        return ScheduledRecordingsView;
});
