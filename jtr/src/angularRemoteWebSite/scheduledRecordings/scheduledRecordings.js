/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('scheduledRecordings', ['$scope', '$http', function($scope, $http){

    $scope.name = 'Scheduled Recordings';
    console.log($scope.name + " screen displayed");

}])
