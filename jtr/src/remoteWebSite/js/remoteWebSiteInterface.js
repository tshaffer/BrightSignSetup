/**
 * Created by tedshaffer on 12/5/15.
 */
define(function () {

    console.log("creating remoteWebSiteInit module");

    var hostInterface = {

        appController: null,

        init: function () {
            console.log("remoteWebSiteInit init");
        },

        setAppController: function(appController) {
            this.appController = appController;
        }
    }

    return hostInterface;
});