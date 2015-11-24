/**
 * Created by tedshaffer on 11/18/15.
 */
define(function () {

    console.log("creating RecordNowView module");

    var RecordNowView = Backbone.View.extend({

        initialize: function () {
            console.log("RecordNowView::initialize");
        },

        show: function() {
            //this.setDefaultDateTime();
            this.render();
        },

        //setDefaultDateTime: function () {
        //    this.model.set('dateTime', new Date());
        //},

        render: function () {

            console.log("RecordNowView::render");

            this.$el.html('');

            // Grab the template script
            var theTemplateScript = $("#recordNowTemplate").html();

            // Compile the template
            var theTemplate = Handlebars.compile(theTemplateScript);

            var context = {};

            // Pass our data to the template
            var theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            $("#recordNowPage").append(theCompiledHtml);


            $("#recordNowPage").css("display", "block");

            // set visual elements based on values in model
            //var title = this.model.get('title');
            //$("#manualRecordTitle").val(title);
            //
            //var duration = this.model.get('duration');
            //$("#manualRecordDuration").val(duration);
            //
            //var date = this.model.get('dateTime');
            //
            //var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
            //$("#manualRecordDate").val(dateVal);
            //
            //var timeVal = twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
            //$("#manualRecordTime").val(timeVal);
            //
            //var channel = this.model.get('channel');
            //$("#manualRecordChannel").val(channel);
            //
            //var inputSource = this.model.get('inputSource');
            //this.setElementVisibility("#manualRecordChannelDiv", inputSource == 'tuner');

            $("#recordNowTItle").focus();

            // handlers
            var self = this;
            $("#rbRecordNowTuner").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", true);
            });

            $("#rbRecordNowRoku").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", false);
            });

            $("#rbRecordNowTivo").change(function () {
                self.setElementVisibility("#recordNowChannelDiv", false);
            });

            $("#recordNowPage").css("display", "block");

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
            "click #btnRecordNow": "setRecordNowHandler"
        },

        setRecordNowHandler: function(event) {
            var success = this.updateModelFromUI();
            if (success) {
                this.trigger("recordNowModelUpdateComplete");
            }
            return false;
        },

        updateModelFromUI: function() {

            var duration = $("#recordNowDuration").val();
            var inputSource = $("input:radio[name=recordNowInputSource]:checked").val();
            var channel = $("#recordNowChannel").val();
            var title = this.getRecordingTitle("#recordNowTitle", new Date(), inputSource, channel);

            this.model.set('title', title);
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

    return RecordNowView;
});
