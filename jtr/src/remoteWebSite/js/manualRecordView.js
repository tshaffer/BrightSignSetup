/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    var manualRecordView = Backbone.View.extend({

        initialize: function () {
            console.log("ManualRecordView::initialize");
            this.template = _.template($('#manualRecordTemplate').html());

            //this.listenTo(this, "executeManualRecord", function() {
            //    console.log("ManualRecordView:: executeManualRecord event received");
            //    return false;
            //});

            // doesn't work

            //this.on('click: #btnSetManualRecord', function() {
            //    console.log("ManualRecordView:: executeManualRecord event received");
            //    return false;
            //});

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

            // set visual elements based on values in model
            var title = this.model.get('title');
            $("#manualRecordTitle").val(title);

            var duration = this.model.get('duration');
            $("#manualRecordDuration").val(duration);

            var date = this.model.get('dateTime');

            var dateVal = date.getFullYear() + "-" + this.twoDigitFormat((date.getMonth() + 1)) + "-" + this.twoDigitFormat(date.getDate());
            $("#manualRecordDate").val(dateVal);

            var timeVal = this.twoDigitFormat(date.getHours()) + ":" + this.twoDigitFormat(date.getMinutes());
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

        twoDigitFormat: function (val) {
            val = '' + val;
            if (val.length === 1) {
                val = '0' + val.slice(-2);
            }
            return val;
        },

        // either of the two approaches below work
        //events: {
        //    "click #btnSetManualRecord": function (event) {
        //        console.log("executeManualRecordHandler, trigger executeManualRecord");
        //        this.trigger("executeManualRecord");
        //        return false;
        //    }
        //}

        events: {
            //"click #btnSetManualRecord": "executeManualRecordHandler"
            "click #btnSetManualRecord": "setManualRecordHandler"
        },

        //executeManualRecordHandler: function (event) {
        //    console.log("executeManualRecordHandler, trigger executeManualRecord");
        //    this.trigger("executeManualRecord");
        //    return false;
        //}

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
            var dtEndOfRecording = dateObj.addMinutes(duration);
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


    });

    return manualRecordView;
});
