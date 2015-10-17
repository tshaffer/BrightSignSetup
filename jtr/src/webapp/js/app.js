/**
 * Created by Ted Shaffer on 10/18/2015.
 */
define(function() {

    $(document).ready(function () {

        require(['browser', 'common', 'channelGuide'], function(browser, common, channelGuide) {

            console.log("JTR javascript .ready invoked");
            console.log("User Agent: " + navigator.userAgent);

            // get client from user agent
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf("BrightSign") >= 0) {
                clientType = "BrightSign"
            }
            else if (userAgent.indexOf("iPad") >= 0) {
                clientType = "iPad"
            }

            if (userAgent.indexOf("Mac") >= 0 && userAgent.indexOf("Chrome") < 0) {
                browserTypeIsSafari = true;
            }
            else {
                browserTypeIsSafari = false;
            }

            baseURL = document.baseURI.replace("?", "");
            baseIP = document.baseURI.substr(0, document.baseURI.lastIndexOf(":"));

            //baseURL = "http://10.1.0.241:8080/";
            baseURL = "http://192.168.2.9:8080/";

            console.log("baseURL from document.baseURI is: " + baseURL + ", baseIP is: " + baseIP);
            console.log("browser, common, channelGuide loaded");

            browser.init(baseURL, common, channelGuide);
            common.init(baseURL, browser, channelGuide );
            channelGuide.init(baseURL, browser, common);
        });
    });
});
