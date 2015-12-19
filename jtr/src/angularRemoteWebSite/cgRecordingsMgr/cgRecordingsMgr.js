/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').controller('cgRecordingsMgr', ['$scope', '$http', 'jtrServerService', 'jtrBroadcastService', '$uibModal', function($scope, $http, $jtrServerService, $jtrBroadcastService, $uibModal) {

    console.log("cgRecordingsMgr launched");

    $scope.recordEpisodeItems = [ 'Record', 'Record, set options', 'View upcoming episodes', 'Tune', 'Close' ];
    $scope.scheduledRecordingItems = [ 'Cancel recording', 'Change options', 'View upcoming episodes', 'Tune', 'Close' ];
    $scope.recordSeriesItems = [ 'Record episode', 'Record episode, set options', 'Record series', 'Tune', 'Close' ];
    $scope.scheduledSeriesItems = [ 'Cancel recording', 'Cancel series', 'View upcoming episodes', 'Tune', 'Close' ];


    $scope.stopTimeOnTimeIndex = 4;
    $scope.stopTimeIndex = null;
    $scope.startTimeOptions = ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"];
    $scope.startTimeOnTimeIndex = 3;


    $scope.$on('handleBroadcast', function(eventName, broadcastEventData) {
        console.log("handleBroadcast invoked, received data is: " + broadcastEventData);

        if (broadcastEventData.message == "cgRecordings") {
            $scope.show(broadcastEventData.args);
        }
    });

    $scope.getChannelFromStationIndex = function (stationId) {

        var channel = "";

        $.each($scope.stations, function (index, station) {
            if (stationId == station.StationId) {
                channel = station.AtscMajor + "-" + station.AtscMinor;
                return false;
            }
        });

        return channel;
    }

    $scope.programsMatch = function (scheduledRecording, cgProgram, cgStationId) {

        // JTRTODO - what other criteria should be used?
        var channel = $scope.getChannelFromStationIndex(cgStationId);
        if (channel != scheduledRecording.Channel) return false;

        if (scheduledRecording.Title != this.cgSelectedProgram.title) return false;

        if (new Date(scheduledRecording.DateTime).getTime() != this.cgSelectedProgram.date.getTime()) return false;

        return true;
    }

    $scope.show = function(programData) {

        console.log("cgRecordingsMgr.show invoked");

        var self = this;

        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = {"currentDateTime": currentDateTimeIso};

        $scope.scheduledRecordings = [];
        $scope.stations = [];

        var getStationsPromise = $jtrServerService.getStations();
        var getScheduledRecordingsPromise = $jtrServerService.getScheduledRecordings(currentDateTime);

        Promise.all([getStationsPromise, getScheduledRecordingsPromise]).then(function(args) {
            console.log("examine arg2, arg2, arg3");

            $scope.stations = $jtrServerService.getStationsResult();

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

                modalInstance.result.then(function (selectedItem) {
                    $scope.selected = selectedItem;
                }, function () {
                    console.log('Modal dismissed at: ' + new Date());
                });
            };

            $scope.animationsEnabled = true;

            $scope.openModal('lg');

        });
    }
}]);

