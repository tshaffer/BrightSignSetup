/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

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
                var lastViewedPositionInMinutes = Math.floor(recordedShowModel.attributes.LastViewedPosition / 60);
                var position = lastViewedPositionInMinutes.toString() + " of " + recordedShowModel.attributes.Duration.toString() + " minutes";

                // ID
                var id = "recording" + recordedShowModel.attributes.RecordingId.toString();

                var recordedShowAttributes = {};
                recordedShowAttributes.Id = id;
                recordedShowAttributes.Title = title;
                recordedShowAttributes.StartDateTime = formattedDayDate;
                recordedShowAttributes.Position = position;

                recordedShowsAttributes.push(recordedShowAttributes);
            });
            var context = {
                recordedShows : recordedShowsAttributes
            };

            // Pass our data to the template
            var theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            $("#recordedShowsTableBody").append(theCompiledHtml);

            $("#recordedShowsPage").css("display", "block");

            return this;
        }


    });

    return recordedShowsView;
});
