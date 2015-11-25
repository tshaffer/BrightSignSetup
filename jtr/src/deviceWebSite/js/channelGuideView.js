/**
 * Created by tedshaffer on 11/6/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating ChannelGuideView module");

    var ChannelGuideView = Backbone.View.extend({

        channelGuideDisplayStartDateTime: null,
        channelGuideDisplayEndDateTime: null,
        channelGuideDisplayCurrentDateTime: null,
        channelGuideDisplayCurrentEndDateTime: null,

        _currentSelectedProgramButton: null,
        _currentStationIndex: null,

        widthOfThirtyMinutes: 240,    // pixels
        channelGuideHoursDisplayed: 3,

        initialize: function () {
            console.log("ChannelGuideView::initialize");
            this.template = _.template($('#channelGuideTemplate').html());
        },

        addHandlers: function() {

            var self = this;
            $("#btnNavigateBackwardOneDay").click(function (event) {
                self.navigateBackwardOneDay();
            });

            $("#btnNavigateBackwardOneScreen").click(function (event) {
                self.navigateBackwardOneScreen();
            });

            $("#btnNavigateForwardOneScreen").click(function (event) {
                self.navigateForwardOneScreen();
            });

            $("#btnNavigateForwardOneDay").click(function (event) {
                self.navigateForwardOneDay();
            });

            $("#cgData").keydown(function (keyEvent) {
                var keyIdentifier = event.keyIdentifier;
                if (keyIdentifier == "Right" || keyIdentifier == "Left" || keyIdentifier == "Up" || keyIdentifier == "Down") {
                    self.navigateChannelGuide(keyIdentifier.toLowerCase());
                    return false;
                }
                else if (keyIdentifier == "Enter") {
                    var programData = self.getSelectedStationAndProgram();
                    self.trigger("displayCGPopup", programData);
                    return false;
                }
            });

        },

        getSelectedStationAndProgram: function () {

            var programInfo = this.parseProgramId(this._currentSelectedProgramButton);
            var programList = this.model.getProgramList(programInfo.stationId);

            var programData = {};
            programData.stationId = programInfo.stationId;
            programData.program = programList[programInfo.programIndex];
            return programData;
        },

        show: function() {
            this.render();
        },

        render: function () {
            console.log("ChannelGuideView::render");
            this.$el.html(this.template()); // this.$el is a jQuery wrapped el var
            this.addHandlers();

            this.renderChannelGuide();

            // handlers
            //var self = this;
            //$("#rbManualRecordTuner").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", true);
            //});
            //
            //$("#rbManualRecordRoku").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", false);
            //});
            //
            //$("#rbManualRecordTivo").change(function () {
            //    self.setElementVisibility("#manualRecordChannelDiv", false);
            //});

            $("#channelGuidePage").css("display", "block");

            return this;
        },

        renderChannelGuide: function () {

            // start date/time for channel guide display is current time, rounded down to nearest 30 minutes
            var currentDate = new Date();
            var startMinute = (parseInt(currentDate.getMinutes() / 30) * 30) % 60;
            var startHour = currentDate.getHours();

            this.channelGuideDisplayStartDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute, 0, 0);

            this.channelGuideDisplayCurrentDateTime = new Date(this.channelGuideDisplayStartDateTime);
            this.channelGuideDisplayCurrentEndDateTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(3);

            this.renderChannelGuideAtDateTime();
        },

        // draw the channel guide, starting at this.channelGuideDisplayStartDateTime
        renderChannelGuideAtDateTime: function () {

            // start date/time of data structure containing channel guide data
            var channelGuideDataStructureStartDateTime = this.model.getProgramScheduleStartDateTime();

            // time difference between start of channel guide display and start of channel guide data
            var timeDiffInMinutes = msecToMinutes(this.channelGuideDisplayStartDateTime - channelGuideDataStructureStartDateTime);

            // index into the data structure (time slots) that contains the first show to display in the channel guide based on the time offset into channel guide data
            var currentChannelGuideOffsetIndex = parseInt(timeDiffInMinutes / 30);

            var maxMinutesToDisplay = 0;
            var minutesToDisplay;

            var self = this;

            $.each(this.stations, function (stationIndex, station) {

                // iterate through initialShowsByTimeSlot to get programs to display
                var programSlotIndices = self.model.getProgramSlotIndices(station.StationId);

                var programList = self.model.getProgramList(station.StationId);

                var indexIntoProgramList = programSlotIndices[currentChannelGuideOffsetIndex];

                var minutesAlreadyDisplayed = 0;

                // build id of div containing the UI elements of the programs for the current station
                var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
                $(cgProgramLineName).empty();

                // first show to display for this station
                showToDisplay = programList[indexIntoProgramList];

                // calculate the time delta between the time of the channel guide display start and the start of the first show to display
                // reduce the duration of the first show by this amount (time the show would have already been airing as of this time)
                timeDiffInMinutes = msecToMinutes(self.channelGuideDisplayStartDateTime - new Date(showToDisplay.date));

                var programStationData = self.model.getProgramStationData(station.StationId);
                programStationData.programUIElementIndices = [];

                var slotIndex = 0;
                var uiElementCount = 0;

                var toAppend = "";
                minutesToDisplay = 0;
                while (indexIntoProgramList < programList.length) {

                    var durationInMinutes = Number(showToDisplay.duration);

                    // perform reduction for only the first show in case it's already in progress at the beginning of this station's display
                    if (toAppend == "") {
                        durationInMinutes -= timeDiffInMinutes;
                    }

                    minutesToDisplay += durationInMinutes;

                    var cssClasses = "";
                    var widthSpec = "";
                    if (durationInMinutes == 30) {
                        cssClasses = "'btn-secondary thirtyMinuteButton'";
                    }
                    else if (durationInMinutes == 60) {
                        cssClasses = "'btn-secondary sixtyMinuteButton'";
                    }
                    else {
                        cssClasses = "'btn-secondary variableButton'";
                        var width = (durationInMinutes / 30) * self.widthOfThirtyMinutes;
                        widthSpec = " style='width:" + width.toString() + "px'";
                    }
                    var id = "show-" + station.StationId + "-" + indexIntoProgramList.toString();
                    var title = showToDisplay.title;
                    toAppend +=
                        "<button id='" + id + "' class=" + cssClasses + widthSpec + ">" + title + "</button>";

                    var programStartTime = minutesAlreadyDisplayed;                     // offset in minutes
                    var programEndTime = minutesAlreadyDisplayed + durationInMinutes;   // offset in minutes
                    var slotTime = slotIndex * 30;
                    while (programStartTime <= slotTime && slotTime < programEndTime) {
                        programStationData.programUIElementIndices[slotIndex] = uiElementCount;
                        slotIndex++;
                        slotTime = slotIndex * 30;
                    }

                    minutesAlreadyDisplayed += durationInMinutes;
                    indexIntoProgramList++;
                    showToDisplay = programList[indexIntoProgramList];

                    uiElementCount++;
                }
                $(cgProgramLineName).append(toAppend);

                if (minutesToDisplay > maxMinutesToDisplay) {
                    maxMinutesToDisplay = minutesToDisplay;
                }
            });
            this.updateTextAlignment();

            // build and display timeline
            var toAppend = "";
            $("#cgTimeLine").empty();
            var timeLineCurrentValue = this.channelGuideDisplayStartDateTime;
            var minutesDisplayed = 0;
            while (minutesDisplayed < maxMinutesToDisplay) {

                var timeLineTime = timeOfDay(timeLineCurrentValue);

                toAppend += "<button class='thirtyMinuteTime'>" + timeLineTime + "</button>";
                timeLineCurrentValue = new Date(timeLineCurrentValue.getTime() + minutesToMsec(30));
                minutesDisplayed += 30;
            }
            this.channelGuideDisplayEndDateTime = timeLineCurrentValue;

            $("#cgTimeLine").append(toAppend);

            // setup handlers on children for browser - when user clicks on program to record, etc.
            $("#cgData").click(function (event) {
                var buttonClicked = event.target;
                if (event.target.id != "") {
                    // presence of an id means that it's not a timeline button
                    var programInfo = self.parseProgramId($(event.target)[0]);
                    var programList = self.model.getProgramList(programInfo.stationId);
                    self.selectProgramTime = programList[programInfo.programIndex].date;

                    // JTRTODO - linear search
                    // get stationIndex
                    $.each(self.stations, function (stationIndex, station) {
                        if (station.StationId == programInfo.stationId) {

                            self._currentStationIndex = stationIndex;
                            self.selectProgram(self._currentSelectedProgramButton, event.target);
                            var programData = self.getSelectedStationAndProgram();
                            self.trigger("displayCGPopup", programData);

                            return false;
                        }
                    });
                }
            });

            var self = this;

            var promise = serverInterface.retrieveLastTunedChannel();
            promise.then(function() {
                console.log("ChannelGuideView:: lastTunedChannel promise fulfilled");
                var stationNumber = serverInterface.getLastTunedChannel();
                var stationIndex = self.getStationIndexFromName(stationNumber)
                var stationRow = $("#cgData").children()[stationIndex + 1];
                self._currentSelectedProgramButton = $(stationRow).children()[0];
                self.selectProgram(null, self._currentSelectedProgramButton, 0);
                self._currentStationIndex = stationIndex;
            })
        },

        getSlotIndex: function (dateTime) {

            // compute the time difference between the new time and where the channel guide data begins (and could be displayed)
            var timeDiffInMinutes = msecToMinutes(dateTime.getTime() - this.channelGuideDisplayStartDateTime.getTime());

            // compute number of 30 minute slots to scroll
            var slotIndex = parseInt(timeDiffInMinutes / 30);
            if (slotIndex < 0) {
                slotIndex = 0;
            }
            return slotIndex;
        },


        scrollToTime: function (newScrollToTime) {

            var slotsToScroll = this.getSlotIndex(newScrollToTime);

            $("#cgData").scrollLeft(slotsToScroll * this.widthOfThirtyMinutes)

            this.channelGuideDisplayCurrentDateTime = newScrollToTime;
            this.channelGuideDisplayCurrentEndDateTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(this.channelGuideHoursDisplayed);
        },

        selectProgramAtTimeOnStation: function (selectProgramTime, stationIndex, currentUIElement) {

            this._currentStationIndex = stationIndex;

            var slotIndex = this.getSlotIndex(selectProgramTime);

            var station = this.stations[stationIndex];
            var stationId = station.StationId;

            var programStationData = this.model.getProgramStationData(stationId);
            var buttonIndex = programStationData.programUIElementIndices[slotIndex];

            // get the array of program buttons for this station
            var cgProgramsInStationRowElement = "#cgStation" + stationIndex.toString() + "Data";
            var programUIElementsInStation = $(cgProgramsInStationRowElement).children();       // programs in that row

            var nextActiveUIElement = programUIElementsInStation[buttonIndex];

            this.selectProgram(currentUIElement, nextActiveUIElement);
        },

        // get the index of the button in a row / div
        getActiveButtonIndex: function (activeButton, buttonsInRow) {

            var positionOfActiveElement = $(activeButton).position();

            var indexOfActiveButton = -1;
            $.each(buttonsInRow, function (buttonIndex, buttonInRow) {
                var buttonPosition = $(buttonInRow).position();
                if (buttonPosition.left == positionOfActiveElement.left) {
                    indexOfActiveButton = buttonIndex;
                    return false;
                }
            });
            return indexOfActiveButton;
        },

        updateActiveProgramUIElement: function (activeProgramUIElement, newActiveProgramUIElement) {

            if (activeProgramUIElement != null) {
                $(activeProgramUIElement).removeClass("btn-primary");
                $(activeProgramUIElement).addClass("btn-secondary");
            }

            $(newActiveProgramUIElement).removeClass("btn-secondary");
            $(newActiveProgramUIElement).addClass("btn-primary");

            $(newActiveProgramUIElement).focus();

            this._currentSelectedProgramButton = newActiveProgramUIElement;
        },


        parseProgramId: function (programUIElement) {

            var programInfo = {};

            var programId = programUIElement.id;
            var idParts = programId.split("-");
            programInfo.stationId = idParts[1];
            programInfo.programIndex = idParts[2];

            return programInfo;
        },


        updateProgramInfo: function (programUIElement) {

            var programInfo = this.parseProgramId($(programUIElement)[0]);

            var programList = this.model.getProgramList(programInfo.stationId);
            var selectedProgram = programList[programInfo.programIndex];

            // display title (prominently)
            $("#cgProgramName").text(selectedProgram.title);

            // display day/date of selected program in upper left of channel guide
            var programDayDate = dayDate(selectedProgram.date);
            $("#cgDayDate").text(programDayDate);

            $("#programInfo").empty();

            // day, date, and time
            var startTime = timeOfDay(selectedProgram.date);

            var endDate = new Date(selectedProgram.date.getTime()).addMinutes(selectedProgram.duration);
            var endTime = timeOfDay(endDate);

            var dateTimeInfo = programDayDate + " " + startTime + " - " + endTime;

            var episodeInfo = "";
            if (selectedProgram.showType == "Series" && selectedProgram.newShow == 0) {
                episodeInfo = "Rerun";
                if (selectedProgram.originalAirDate != "") {
                    episodeInfo += ": original air date was " + selectedProgram.originalAirDate;
                    if (selectedProgram.seasonEpisode != "") {
                        episodeInfo += ", " + selectedProgram.seasonEpisode;
                    }
                }
            }

            $("#cgDateTimeInfo").html(dateTimeInfo)

            var episodeTitle = selectedProgram.episodeTitle;
            if (episodeTitle == "") {
                episodeTitle = "<br/>";
            }
            $("#cgEpisodeTitle").html(episodeTitle)

            var programDescription = selectedProgram.longDescription;
            if (programDescription == "") {
                programDescription = selectedProgram.shortDescription;
            }
            if (programDescription == "") {
                programDescription = "<br/>";
            }
            $("#cgDescription").html(programDescription)

            var castMembers = selectedProgram.castMembers;
            if (castMembers == "") {
                castMembers = "<br/>";
            }
            $("#cgCastMembers").html(castMembers)

            if (episodeInfo == "") {
                episodeInfo = "<br/>";
            }
            $("#episodeInfo").html(episodeInfo)
        },


        selectProgram: function (activeProgramUIElement, newActiveProgramUIElement) {

            this.updateActiveProgramUIElement(activeProgramUIElement, newActiveProgramUIElement);

            this.updateProgramInfo(newActiveProgramUIElement)

        },

        reselectProgram: function () {

            this.updateActiveProgramUIElement(null, this._currentSelectedProgramButton);

            this.updateProgramInfo(this._currentSelectedProgramButton)

        },

        navigateBackwardOneScreen: function () {

            newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(-this.channelGuideHoursDisplayed);
            if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
                newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
            }

            this.scrollToTime(newScrollToTime)
            this.updateTextAlignment();

            this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
        },


        navigateBackwardOneDay: function () {

            newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(-24);
            if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
                newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
            }
            this.scrollToTime(newScrollToTime)
            this.updateTextAlignment();

            this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
        },


        navigateForwardOneScreen: function () {

            newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(this.channelGuideHoursDisplayed);
            var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
            if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
                newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
            }
            this.scrollToTime(newScrollToTime)
            this.updateTextAlignment();

            this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
        },


        navigateForwardOneDay: function () {

            newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addHours(24);
            var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
            if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
                newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
            }
            this.scrollToTime(newScrollToTime)
            this.updateTextAlignment();

            this.selectProgramAtTimeOnStation(newScrollToTime, this._currentStationIndex, this._currentSelectedProgramButton);
        },


        getProgramFromUIElement: function (element) {

            var programInfo = this.parseProgramId($(element)[0]);

            var programList = this.model.getProgramList(programInfo.stationId);
            var selectedProgram = programList[programInfo.programIndex];
            return selectedProgram;
        },

        isProgramStartVisible: function (element) {

            var program = this.getProgramFromUIElement(element);
            var programDate = program.date;

            if ((this.channelGuideDisplayCurrentDateTime <= programDate) && (programDate < this.channelGuideDisplayCurrentEndDateTime)) return true;

            return false;
        },


        isProgramEndVisible: function (element) {

            var program = this.getProgramFromUIElement(element);
            var programStartDateTime = program.date;
            var programEndDateTime = new Date(programStartDateTime.getTime() + program.duration * 60000);

            if (programEndDateTime > this.channelGuideDisplayCurrentEndDateTime) return false;
            if (programEndDateTime <= this.channelGuideDisplayCurrentDateTime) return false;

            return true;
        },

        navigateChannelGuide: function (direction) {

            // get div for current active button
            var activeStationRowUIElement = this._currentSelectedProgramButton.parentElement;           // current row of the channel guide
            var programUIElementsInStation = $(activeStationRowUIElement).children();                   // programs in that row

            var indexOfSelectedProgramElement = this.getActiveButtonIndex(this._currentSelectedProgramButton, programUIElementsInStation);
            if (indexOfSelectedProgramElement >= 0) {
                if (direction == "right") {

                    var programEndIsVisible = this.isProgramEndVisible(this._currentSelectedProgramButton);

                    // if the end of the current program is fully visible, go to the next program
                    // if the start of the next program is not visible, scroll to the left by 30 minutes
                    // select the next program
                    if (programEndIsVisible) {
                        var indexOfNewProgramElement = indexOfSelectedProgramElement + 1;
                        if (indexOfNewProgramElement < $(programUIElementsInStation).length) {
                            var newProgramElement = $(programUIElementsInStation)[indexOfNewProgramElement];
                            var programStartIsVisible = this.isProgramStartVisible(newProgramElement);
                            if (!programStartIsVisible) {
                                newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(30);
                                this.scrollToTime(newScrollToTime);
                            }
                            this.updateTextAlignment();
                            this.selectProgram(this._currentSelectedProgramButton, newProgramElement);
                        }
                    }

                    // else if the current program's end point is not visible, move forward by 30 minutes.
                    else {
                        newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(30);
                        var proposedEndTime = new Date(newScrollToTime).addHours(this.channelGuideHoursDisplayed);
                        if (proposedEndTime > this.channelGuideDisplayEndDateTime) {
                            newScrollToTime = new Date(this.channelGuideDisplayEndDateTime).addHours(-this.channelGuideHoursDisplayed);
                        }

                        this.scrollToTime(newScrollToTime);
                        this.updateTextAlignment();
                    }

                    // JTRTODO - check for limit on right side; either fetch more epg data or stop scrolling at the end
                }
                else if (direction == "left") {

                    var programStartIsVisible = this.isProgramStartVisible(this._currentSelectedProgramButton);

                    // if the start of the current program is fully visible, go to the prior program
                    // if the end of the prior program is not visible, scroll to the right by 30 minutes
                    // select the prior program
                    if (programStartIsVisible) {
                        if (indexOfSelectedProgramElement > 0) {
                            var indexOfNewProgramElement = indexOfSelectedProgramElement - 1;
                            if (indexOfNewProgramElement < $(programUIElementsInStation).length) {
                                var newProgramElement = $(programUIElementsInStation)[indexOfNewProgramElement];
                                var programEndIsVisible = this.isProgramEndVisible(newProgramElement);
                                if (!programEndIsVisible) {
                                    newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(-30);
                                    this.scrollToTime(newScrollToTime);
                                }
                                this.selectProgram(this._currentSelectedProgramButton, newProgramElement);
                                this.updateTextAlignment();
                            }
                        }
                    }

                    // else if the current program's start point is not visible, move backward by 30 minutes.
                    else {
                        newScrollToTime = new Date(this.channelGuideDisplayCurrentDateTime).addMinutes(-30);

                        if (newScrollToTime < this.channelGuideDisplayStartDateTime) {
                            newScrollToTime = new Date(this.channelGuideDisplayStartDateTime);
                        }

                        this.scrollToTime(newScrollToTime);
                        this.updateTextAlignment();
                    }
                }
                else if (direction == "down" || direction == "up") {
                    if ((this._currentStationIndex < this.stations.length - 1 && direction == "down") || (this._currentStationIndex > 0 && direction == "up")) {

                        var newRowIndex;
                        if (direction == "down") {
                            newRowIndex = this._currentStationIndex + 1;
                        }
                        else {
                            newRowIndex = this._currentStationIndex - 1;
                        }

                        // when moving up/down, don't scroll
                        // select the program at the same time
                        // if that program's start is visible, the this.selectProgramTime is the start time of the current selected program
                        // if it's not visible, the this.selectProgramTime is the current start of display of the channel guide
                        var selectProgramTime;
                        var programStartIsVisible = this.isProgramStartVisible(this._currentSelectedProgramButton);
                        if (programStartIsVisible) {
                            var programInfo = this.parseProgramId(this._currentSelectedProgramButton);

                            var programList = this.model.getProgramList(programInfo.stationId);
                            selectProgramTime = programList[programInfo.programIndex].date;
                        }
                        else {
                            selectProgramTime = this.channelGuideDisplayCurrentDateTime;
                        }

                        this.selectProgramAtTimeOnStation(selectProgramTime, newRowIndex, this._currentSelectedProgramButton);
                        this.updateTextAlignment();
                    }
                }
            }
        },


        updateTextAlignment: function () {

            var self = this;

            $.each(this.stations, function (stationIndex, station) {
                var cgProgramLineName = "#cgStation" + stationIndex.toString() + "Data";
                var cgProgramsOnStation = $(cgProgramLineName).children();
                $.each(cgProgramsOnStation, function (buttonIndex, cgProgramButton) {
                    var programStartIsVisible = self.isProgramStartVisible(cgProgramButton);
                    var programEndIsVisible = self.isProgramEndVisible(cgProgramButton);
                    if (programStartIsVisible && programEndIsVisible) {
                        $(cgProgramButton).css('text-align', 'center');
                    }
                    else if (programStartIsVisible) {
                        $(cgProgramButton).css('text-align', 'left');
                    }
                    else if (programEndIsVisible) {
                        $(cgProgramButton).css('text-align', 'right');
                    }
                    else {
                        $(cgProgramButton).css('text-align', 'center');
                    }
                });
            });
        },


        getStationIndexFromName: function (stationNumber) {

            var stationIndex = -1;

            //var self = this;
            //$.each(this.stations, function (index, station) {
            //    if (self.stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
            //        stationIndex = Number(index);
            //        return false;
            //    }
            //});

            var self = this;
            this.stations.forEach(function(station, index, stations) {
                if (self.stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
                    stationIndex = index;
                    return false;
                }
            });

            return stationIndex;
        },

        stationNumbersEqual: function (stationNumber1, stationNumber2) {

            if (stationNumber1 == stationNumber2) return true;

            stationNumber1 = this.standardizeStationNumber(stationNumber1);
            stationNumber2 = this.standardizeStationNumber(stationNumber2);
            return (stationNumber1 == stationNumber2);
        },

        standardizeStationNumber: function (stationNumber) {

            stationNumber = stationNumber.replace(".1", "");
            stationNumber = stationNumber.replace("-1", "");
            stationNumber = stationNumber.replace("-", ".");

            return stationNumber;
        },

        executeRemoteCommand: function(remoteCommand) {
            console.log("channelGuideView:executeRemoteCommand:" + remoteCommand);

            switch (remoteCommand) {
                case "MENU":
                    console.log("channelGuideView::invokeHomeHandler invoked");
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

    return ChannelGuideView;
});
