/**
 * Created by tedshaffer on 10/27/15.
 */
define(function () {

    console.log("creating MainMenuView module");

    var MainMenuView = Backbone.View.extend({

        mainMenuIds : [
            ['recordedShows', 'liveVideo'],
            ['recordNow', 'channelGuideId'],
            ['manualRecord', 'scheduledRecordings'],
            ['', 'settings']
        ],


        initialize: function () {
                console.log("MainMenuView::initialize");

                this.template = _.template($('#homePageTemplate').html());
         },

        //events: {
        //    //"click #recordedShows": "recordedShowsHandler",
        //    "click #recordNow": "recordNowHandler",
        //    "click #manualRecord": "manualRecordHandler",
        //    "click #channelGuideId": "channelGuideHandler",
        //    "click #scheduledRecordings": "scheduledRecordingsHandler",
        //    "click #settings": "settingsHandler"
        //},

        recordedShowsHandler: function (event) {
            // Button clicked, you can access the element that was clicked with event.currentTarget
            console.log("recordedShowsHandler, trigger invokeRecordedShows");
            // broadcast event - only goes to those objects specifically listening to MainMenuView
            this.trigger("invokeRecordedShows");
        },

        recordNowHandler: function (event) {
            console.log("recordNowHandler, trigger invokeRecordNow");
            this.trigger("invokeRecordNow");
        },

        manualRecordHandler: function (event) {
            console.log("manualRecordHandler, trigger invokeManualRecord");
            this.trigger("invokeManualRecord");
        },

        channelGuideHandler: function (event) {
            console.log("channelGuideHandler, trigger invokeChannelGuide");
            this.trigger("invokeChannelGuide");
        },

        scheduledRecordingsHandler: function (event) {
            console.log("scheduledRecordingsHandler, trigger invokeScheduledRecordings");
            this.trigger("invokeScheduledRecordings");
        },

        settingsHandler: function (event) {
            console.log("settingsHandler, trigger invokeSettings");
            this.trigger("invokeSettings");
        },

        show: function() {
            this.render();
        },

        addClickHandlers: function() {

            var self = this;

            $(".homePageBtn").keydown (function(event) {
                // event.target
                // event.target.id
                // event.which
                console.log("homePageBtn keydown");

                if (event.which == "exit") {
                    self.trigger("eraseUI")
                }
                else {
                    self.navigate(event.which);
                }
            });

            $("#recordedShows").click(function (event) {
                self.recordedShowsHandler(event);
            });

            $("#recordNow").click(function (event) {
                self.recordNowHandler(event);
            });

            $("#manualRecord").click(function (event) {
                self.manualRecordHandler(event);
            });

            $("#channelGuideId").click(function (event) {
                self.channelGuideHandler(event);
            });

            $("#scheduledRecordings").click(function (event) {
                self.scheduledRecordingsHandler(event);
            });

            $("#settings").click(function (event) {
                self.settingsHandler(event);
            });
        },

        render: function () {

            var self = this;

            console.log("MainMenuView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var

            this.addClickHandlers();

            $("#homePage").css("display", "block");

            for (i = 0; i < this.mainMenuIds.length; i++) {
                for (j = 0; j < this.mainMenuIds[i].length; j++) {
                    var elementId = "#" + this.mainMenuIds[i][j];

                    if (i != 0 || j != 0) {
                        $(elementId).removeClass("btn-primary");
                        $(elementId).addClass("btn-secondary");
                    }
                    else {
                        $(elementId).removeClass("btn-secondary");
                        $(elementId).addClass("btn-primary");
                        $(elementId).focus();
                    }
                }
            }

            return this;
        },

        //executeRemoteCommand: function(remoteCommand) {
        //    console.log("mainMenuView:executeRemoteCommand:" + remoteCommand);
        //
        //    switch (remoteCommand) {
        //        case "UP":
        //        case "DOWN":
        //        case "LEFT":
        //        case "RIGHT":
        //            this.navigate(remoteCommand);
        //            break;
        //        case "SELECT":
        //            this.select(remoteCommand);
        //            break;
        //    }
        //},
        //
        //select: function() {
        //
        //    var currentElement = document.activeElement;
        //    var currentElementId = currentElement.id;
        //
        //    switch (currentElementId) {
        //        case "recordedShows":
        //            this.trigger("invokeRecordedShows");
        //            break;
        //        case "recordNow":
        //            this.trigger("invokeRecordNow");
        //            break;
        //        case "manualRecord":
        //            this.trigger("invokeManualRecord");
        //            break;
        //        case "channelGuideId":
        //            this.trigger("invokeChannelGuide");
        //            break;
        //        case "scheduledRecordings":
        //            this.trigger("invokeScheduledRecordings");
        //            break;
        //        case "settings":
        //            this.trigger("invokeSettings");
        //            break;
        //    };
        //},

        navigate: function(direction) {

            var rowIndex = -1;
            var colIndex = -1;

            var currentElement = document.activeElement;
            var currentElementId = currentElement.id;

            for (i = 0; i < this.mainMenuIds.length; i++) {
                for (j = 0; j < this.mainMenuIds[i].length; j++) {
                    if (this.mainMenuIds[i][j] == currentElementId) {
                        rowIndex = i;
                        colIndex = j;
                        break;
                    }
                    // break again if necessary?
                }
            }

            if (rowIndex >= 0 && colIndex >= 0) {
                switch (direction) {
                    //case "up":
                    case 38:
                        if (rowIndex > 0) rowIndex--;
                        break;
                    //case "down":
                    case 40:
                        if (rowIndex < this.mainMenuIds.length) rowIndex++;
                        break;
                    //case "left":
                    case 37:
                        if (colIndex > 0) colIndex--;
                        break;
                    case 39:
                    //case "right":
                        if (colIndex < this.mainMenuIds[0].length) colIndex++;
                        break;
                }
            }
            else {
                rowIndex = 0;
                colIndex = 0;
            }

            console.log("currentElementId is " + currentElementId);

            var newElementId = "#" + this.mainMenuIds[rowIndex][colIndex];

            $("#" + currentElementId).removeClass("btn-primary");
            $("#" + currentElementId).addClass("btn-secondary");

            $(newElementId).removeClass("btn-secondary");
            $(newElementId).addClass("btn-primary");

            $(newElementId).focus();

        },
    });

    return MainMenuView;
});
