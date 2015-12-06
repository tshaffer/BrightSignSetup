/**
 * Created by Ted Shaffer on 10/18/2015.
 */
$(document).ready(function () {

    baseURL = "http://localHost:8080/";

    constants = {};
    constants.KEY_DOWN = 40;
    constants.KEY_UP = 38;
    constants.KEY_RIGHT = 39;
    constants.KEY_LEFT= 37;

    requirejs(['appController']);
});

