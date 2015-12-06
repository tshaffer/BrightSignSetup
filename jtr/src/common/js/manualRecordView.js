/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    console.log("creating ManualRecordView module");

    var ManualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());
        },

        show: function() {
            this.setDefaultDateTime();
            this.render();
        },

        setDefaultDateTime: function () {
            this.model.set('dateTime', new Date());
        },

        render: function () {
            console.log("ManualRecordView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            // will need to fix this to support from this screen on device
            // with this code in, text entry doesn't work as keydown swallows keystrokes
            //$("#manualRecordPage").keydown(function (event) {
            //    if (event.which == 'menu') {
            //        console.log("menu button pressed in manualRecordPage");
            //        self.trigger("invokeHome");
            //        return true;
            //    }
            //    else if (event.which == "exit") {
            //        console.log("exit button pressed in manualRecordPage");
            //        self.trigger("eraseUI");
            //        return true;
            //    }
            //    return false;
            //});

            // set visual elements based on values in model
            var title = this.model.get('title');
            $("#manualRecordTitle").val(title);

            var duration = this.model.get('duration');
            $("#manualRecordDuration").val(duration);

            var date = this.model.get('dateTime');

            var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
            $("#manualRecordTime").val(timeVal);

            var channel = this.model.get('channel');
            $("#manualRecordChannel").val(channel);

            var inputSource = this.model.get('inputSource');
            this.setElementVisibility("#manualRecordChannelDiv", inputSource == 'tuner');

            $("#manualRecordTitle").focus();

            // handlers
            var self = this;
            $("#rbManualRecordTuner").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", true);
            });

            $("#rbManualRecordRoku").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#rbManualRecordTivo").change(function () {
                self.setElementVisibility("#manualRecordChannelDiv", false);
            });

            $("#manualRecordPage").css("display", "block");

            $("#manualRecordTitle").focus();

            return this;
        },

        setElementVisibility: function (divId, show) {
            if (show) {
                $(divId).show();
            }
            else {
                $(divId).hide();
            }
        },

        events: {
            "click #btnSetManualRecord": "setManualRecordHandler"
        },

        setManualRecordHandler: function(event) {
            var success = this.updateModelFromUI();
            if (success) {
                this.trigger("manualRecordModelUpdateComplete");
            }
            return false;
        },

        updateModelFromUI: function() {

            // retrieve date/time from html elements and convert to a format that works on all devices
            var date = $("#manualRecordDate").val();
            var time = $("#manualRecordTime").val();
            var dateTimeStr = date + " " + time;

            // required for iOS devices - http://stackoverflow.com/questions/13363673/javascript-date-is-invalid-on-ios
            var compatibleDateTimeStr = dateTimeStr.replace(/-/g, '/');

            var dateObj = new Date(compatibleDateTimeStr);

            var duration = $("#manualRecordDuration").val();

            var inputSource = $("input:radio[name=manualRecordInputSource]:checked").val();

            var channel = $("#manualRecordChannel").val();

            var title = this.getRecordingTitle("#manualRecordTitle", dateObj, inputSource, channel);

            // check to see if recording is in the past
            //var dtEndOfRecording = addMinutes(dateObj, duration);
            var dtEndOfRecording = new Date(dateObj).addMinutes(duration);
            var now = new Date();

            var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
            if (millisecondsUntilEndOfRecording < 0) {
                alert("Recording time is in the past - change the date/time and try again.");
                return false;
            }

            this.model.set('title', title);
            this.model.set('dateTime', dateObj);
            this.model.set('duration', duration);
            this.model.set('inputSource', inputSource);
            this.model.set('channel', channel);
            this.model.set('scheduledSeriesRecordingId', -1);

            return true;
        },

        getRecordingTitle: function (titleId, dateObj, inputSource, channel) {

            var title = $(titleId).val();
            if (!title) {
                title = 'MR ' + dateObj.getFullYear() + "-" + this.twoDigitFormat((dateObj.getMonth() + 1)) + "-" + this.twoDigitFormat(dateObj.getDate()) + " " + this.twoDigitFormat(dateObj.getHours()) + ":" + this.twoDigitFormat(dateObj.getMinutes());
                if (inputSource == "tuner") {
                    title += " Channel " + channel;
                } else if (inputSource == "tivo") {
                    title += " Tivo";
                } else {
                    title += " Roku";
                }
            }

            return title;
        },

        executeRemoteCommand: function(remoteCommand) {
            console.log("manualRecordView:executeRemoteCommand:" + remoteCommand);

            switch (remoteCommand) {
                case "MENU":
                    console.log("manualRecordView::invokeHomeHandler invoked");
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

    return ManualRecordView;
});
