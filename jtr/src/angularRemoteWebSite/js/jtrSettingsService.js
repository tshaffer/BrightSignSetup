/**
 * Created by tedshaffer on 12/20/15.
 */
angular.module('jtr').service('jtrSettingsService', ['jtrServerService', function($jtrServerService){

    this.settings = {};
    this.settingsLoaded = false;

    this.getSettingsResult = function() {
        return this.settings;
    }

    this.getSettings = function() {

        var self = this;

        if (this.settingsLoaded.length > 0) {
            var promise = new Promise(function(resolve, reject) {
                resolve();
            });
            return promise;
        }
        else {
            var promise = $jtrServerService.getSettings();
            promise.then(function(result) {
                self.settings = result.data;
            });
            return promise;
        }
    };

    this.setSettings = function(settings) {
        var promise = $jtrServerService.setSettings(settings);
        return promise;
    };
}]);
