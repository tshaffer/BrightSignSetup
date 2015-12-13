/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('settings', ['$scope', '$http', function($scope, $http){

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

}]);

