/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('jtr').controller('jtrModal', function($scope, $uibModalInstance, modalTitle, items) {

    $scope.modalTitle = modalTitle;
    $scope.items = items;
    $scope.selected = {
        item: $scope.items[0]
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
})
