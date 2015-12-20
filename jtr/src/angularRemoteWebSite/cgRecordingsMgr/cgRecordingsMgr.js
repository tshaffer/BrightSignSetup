/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').controller('cgRecordingsMgr', ['$scope', '$http', 'jtrServerService', 'jtrStationsService', 'jtrSettingsService', 'jtrBroadcastService', '$uibModal', function($scope, $http, $jtrServerService, $jtrStationsService, $jtrSettingsService, $jtrBroadcastService, $uibModal) {

    console.log("cgRecordingsMgr launched");

    $scope.dialogHandler = null;

    $scope.recordEpisodeItems = [ 'Record', 'Record, set options', 'View upcoming episodes', 'Tune', 'Close' ];
    $scope.scheduledRecordingItems = [ 'Cancel recording', 'Change options', 'View upcoming episodes', 'Tune', 'Close' ];
    $scope.recordSeriesItems = [ 'Record episode', 'Record episode, set options', 'Record series', 'Tune', 'Close' ];
    $scope.scheduledSeriesItems = [ 'Cancel recording', 'Cancel series', 'View upcoming episodes', 'Tune', 'Close' ];

    $scope.stopTimeOptions = ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"];
    $scope.stopTimeOffsets = [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180];
    $scope.stopTimeOnTimeIndex = 4;
    $scope.stopTimeIndex = null;

    $scope.startTimeOptions = ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"];
    $scope.startTimeOnTimeIndex = 3;
    $scope.startTimeOffsets = [-15, -10, -5, 0, 5, 10, 15];
    $scope.startTimeIndex = null;

    $scope.addRecordToDB = true;

    $scope.$on('handleBroadcast', function(eventName, broadcastEventData) {
        console.log("handleBroadcast invoked, received data is: " + broadcastEventData);

        if (broadcastEventData.message == "cgRecordings") {

            var promise = $jtrSettingsService.getSettings();
            promise.then( function() {
                $scope.show(broadcastEventData.args);
            });

        }
    });

    $scope.programsMatch = function (scheduledRecording, cgProgram, cgStationId) {

        // JTRTODO - what other criteria should be used?
        var channel = $jtrStationsService.getChannelFromStationIndex(cgStationId);
        if (channel != scheduledRecording.Channel) return false;

        if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

        if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

        return true;
    }

    $scope.retrieveScheduledRecordings = function() {

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = {"currentDateTime": currentDateTimeIso};
        var promise = $jtrServerService.getScheduledRecordings(currentDateTime);
        promise.then(function(scheduledRecordings) {
            $scope.scheduledRecordings = [];
            $.each(scheduledRecordings, function (index, scheduledRecording) {
                $scope.scheduledRecordings.push(scheduledRecording);
            });
        });
    }

    $scope.show = function(programData) {

        console.log("cgRecordingsMgr.show invoked");

        var self = this;

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = {"currentDateTime": currentDateTimeIso};

        $scope.scheduledRecordings = [];

        var getStationsPromise = $jtrStationsService.getStations();
        var getScheduledRecordingsPromise = $jtrServerService.getScheduledRecordings(currentDateTime);

        Promise.all([getStationsPromise, getScheduledRecordingsPromise]).then(function(args) {
            console.log("examine arg2, arg2, arg3");

            // no result from getStationsPromise so getScheduledRecordings is in args[1]
            $scope.scheduledRecordings =  args[1].data;

            $scope.cgSelectedProgram = programData.program;
            $scope.cgSelectedStationId = programData.stationId;

            $scope.stopTimeIndex = $scope.stopTimeOnTimeIndex;
            $scope.startTimeIndex = $scope.startTimeOnTimeIndex;

            // check the program that the user has clicked
            // display different pop ups based on
            //      single vs. series
            //      already scheduled to record or not
            var cgSelectedProgramScheduledToRecord = false;
            $scope.cgSelectedProgram.scheduledRecordingId = -1;
            $scope.cgSelectedProgram.scheduledSeriesRecordingId = -1;
            $scope.cgSelectedProgram.startTimeOffset = 0;
            $scope.cgSelectedProgram.stopTimeOffset = 0;

            $.each($scope.scheduledRecordings, function (index, scheduledRecording) {
                cgSelectedProgramScheduledToRecord = $scope.programsMatch(scheduledRecording, $scope.cgSelectedProgram, $scope.cgSelectedStationId);
                if (cgSelectedProgramScheduledToRecord) {
                    $scope.cgSelectedProgram.scheduledRecordingId = scheduledRecording.Id;
                    $scope.cgSelectedProgram.scheduledSeriesRecordingId = scheduledRecording.ScheduledSeriesRecordingId;
                    $scope.cgSelectedProgram.startTimeOffset = scheduledRecording.StartTimeOffset;
                    $scope.cgSelectedProgram.stopTimeOffset = scheduledRecording.StopTimeOffset;
                    return false;
                }
            });

            $scope.modalTitle = $scope.cgSelectedProgram.title;

            if ($scope.cgSelectedProgram.showType == "Series") {
                if ($scope.cgSelectedProgram.scheduledRecordingId == -1) {
                    // not yet scheduled to record
                    $scope.items = $scope.recordSeriesItems;
                }
                else {
                    // previously scheduled to record
                    if ($scope.cgSelectedProgram.scheduledSeriesRecordingId > 0) {
                        $scope.items = $scope.scheduledSeriesItems;
                    }
                    else {
                        $scope.items = $scope.scheduledRecordingItems;
                    }
                }
            }
            else        // single program recordings (not series)
            {
                if ($scope.cgSelectedProgram.scheduledRecordingId == -1) {         // no recording set
                    $scope.items = $scope.recordEpisodeItems;
                }
                else {                                                          // recording already setup
                    $scope.items = $scope.scheduledRecordingItems;
                }
            }

            $scope.openModal = function (size) {

                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'myModalContent.html',
                    controller: 'jtrModal',
                    size: size,
                    resolve: {
                        modalTitle: function() {
                            return $scope.modalTitle;
                        },
                        items: function () {
                            return $scope.items;
                        }
                    }
                });

                modalInstance.result.then(function (selectedItem, args) {
                    //$scope.selected = selectedItem;
                    $scope.dialogHandler(selectedItem);
                }, function () {
                    console.log('Modal dismissed at: ' + new Date());
                    return;
                });
            };

            $scope.animationsEnabled = true;

            $scope.openModal('sm');

        });
    }

    $scope.dialogHandler = function (dialogChoice) {

        switch (dialogChoice) {
            case 'Record':
            case 'Record episode':
                $scope.invokeRecordEpisode();
                break;
            case 'Record, set options':
            case 'Change options':
            case 'Record episode, set options':
                $scope.invokeRecordProgramSetOptions();
                break;
            case 'View upcoming episodes':
                $scope.invokeViewUpcomingEpisodes();
                break;
            case 'Tune':
                $scope.invokeTune();
                break;
            case 'Cancel recording':
                $scope.invokeCancelRecording();
                break;
            case 'Record series':
                $scope.invokeRecordSeries();
                break;
            case 'Cancel series':
                $scope.invokeCancelSeries();
                break;
        }
    }

    $scope.invokeRecordEpisode = function() {

        $scope.cgSelectedProgram.startTimeOffset = $scope.startTimeOffsets[$scope.startTimeIndex];
        $scope.cgSelectedProgram.stopTimeOffset = $scope.stopTimeOffsets[$scope.stopTimeIndex];

        if ($scope.addRecordToDB) {
            var stationName = $jtrStationsService.getStationFromId($scope.cgSelectedStationId);
            stationName = stationName.replace(".", "-");

            var commandData = {
                "command": "addRecord",
                "dateTime": $scope.cgSelectedProgram.date,
                "title": $scope.cgSelectedProgram.title,
                "duration": $scope.cgSelectedProgram.duration,
                "inputSource": "tuner",
                "channel": stationName,
                "recordingBitRate": $jtrSettingsService.getSettingsResult().RecordingBitRate,
                "segmentRecording": $jtrSettingsService.getSettingsResult().SegmentRecordings,
                "scheduledSeriesRecordingId": $scope.cgSelectedProgram.scheduledSeriesRecordingId,
                "startTimeOffset": $scope.cgSelectedProgram.startTimeOffset,
                "stopTimeOffset": $scope.cgSelectedProgram.stopTimeOffset
            };
        }
        else {
            var commandData = {
                "command": "updateScheduledRecording",
                "id": $scope.cgSelectedProgram.scheduledRecordingId,
                "startTimeOffset": $scope.cgSelectedProgram.startTimeOffset,
                "stopTimeOffset": $scope.cgSelectedProgram.stopTimeOffset
            };
        }

        var promise = $jtrServerService.browserCommand(commandData);
        promise.then(function() {
            $scope.retrieveScheduledRecordings();
        })
    }

    $scope.invokeRecordProgramSetOptions = function() {

        $scope.animationsEnabled = true;

        $scope.addRecordToDB = true;
        if ($scope.cgSelectedProgram.scheduledRecordingId > 0) {
            $scope.addRecordToDB = false;
        }

        $scope.startTimeIndex = $scope.startTimeOnTimeIndex;
        $scope.stopTimeIndex = $scope.stopTimeOnTimeIndex;

        $.each($scope.startTimeOffsets, function (index, startTimeOffset) {
            if (startTimeOffset == $scope.cgSelectedProgram.startTimeOffset) {
                $scope.startTimeIndex = index;
                return false;
            }
        });

        $.each($scope.stopTimeOffsets, function (index, stopTimeOffset) {
            if (stopTimeOffset == $scope.cgSelectedProgram.stopTimeOffset) {
                $scope.stopTimeIndex = index;
                return false;
            }
        });

        $scope.openRecordingOptionsDlg('md');
    }

    $scope.invokeRecordSeries = function() {

        var stationName = $jtrStationsService.getStationFromId($scope.cgSelectedStationId);
        stationName = stationName.replace(".", "-");

        var commandData = {
            "command": "addSeries",
            "title": $scope.cgSelectedProgram.title,
            "inputSource": "tuner",
            "channel": stationName,
            //"recordingBitRate": $scope.getRecordingBitRate(),
            //"segmentRecording": $scope.getSegmentRecordings()
            "recordingBitRate": 6,
            "segmentRecording": 0
        };

        var promise = serverInterface.browserCommand(commandData);
        promise.then(function() {
            $scope.retrieveScheduledRecordings();
        })
    }

    $scope.invokeTune = function() {

        var stationName = $jtrStationsService.getStationFromId($scope.cgSelectedStationId);
        stationName = stationName.replace(".", "-");

        var commandData = { "command": "tuneLiveVideoChannel", "enteredChannel": stationName };

        $jtrServerService.browserCommand(commandData);
    }

    $scope.invokeViewUpcomingEpisodes = function() {
    }

    $scope.invokeCancelRecording = function() {

        var promise = $jtrServerService.deleteScheduledRecording($scope.cgSelectedProgram.scheduledRecordingId);
        promise.then(function() {
            $scope.retrieveScheduledRecordings();
        })
    }

    $scope.invokeCancelSeries = function () {

        var promise = $jtrServerService.deleteScheduledSeries($scope.cgSelectedProgram.scheduledSeriesRecordingId);
        promise.then(function() {
            $scope.retrieveScheduledRecordings();
        })
    }

    $scope.openRecordingOptionsDlg = function (size) {

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'recordingOptionsDlg.html',
            controller: 'cgRecordingOptionsDlg',
            size: size,
            resolve: {
                modalTitle: function() {
                    return $scope.modalTitle;
                },
                startTimeIndex: function() {
                    return $scope.startTimeIndex;
                },
                stopTimeIndex: function() {
                    return $scope.stopTimeIndex;
                }
            }
        });

        modalInstance.result.then(function (args) {
            console.log("recordingOptionsDlg - save invoked");
            $scope.startTimeIndex = args.startTimeIndex;
            $scope.stopTimeIndex = args.stopTimeIndex;

            var promise = $scope.cgRecordProgramFromClient($scope.addRecordToDB);
            promise.then(function() {
                $scope.retrieveScheduledRecordings();
            })

        }, function () {
            console.log('recordingOptionsDlg dismissed at: ' + new Date());
            return;
        });
    };
}]);

