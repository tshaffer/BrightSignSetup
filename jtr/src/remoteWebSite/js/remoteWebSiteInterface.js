/**
 * Created by tedshaffer on 12/5/15.
 */
define(function () {

    console.log("creating remoteWebSiteInterface module");

    var hostInterface = {

        appController: null,

        init: function () {
            console.log("remoteWebSiteInit init");

            baseURL = document.baseURI.replace("?", "");
            baseIP = document.baseURI.substr(0, document.baseURI.lastIndexOf(":"));

            console.log("baseURL in remoteWebSiteInterface, from document.baseURI is: " + baseURL + ", baseIP is: " + baseIP);
        },

        setAppController: function(appController) {
            this.appController = appController;
        }
    }

    return hostInterface;
});