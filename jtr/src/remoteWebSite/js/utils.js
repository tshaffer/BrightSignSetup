/**
 * Created by tedshaffer on 11/9/15.
 */
function msecToMinutes(msec) {
    return msec / 60000;
}

function minutesToMsec(minutes) {
    return minutes * 60000;
}

function dayDate(dateTime)
{
    return dateTime.toString("ddd M/d");
}

function timeOfDay(dateTime) {
    //return dateTime.toString("h:mmtt").toLowerCase();

    // hack to work around apparent date.js bug where hour shows up as 0 inappropriately
    var hour = dateTime.toString("h");
    if (hour == "0") {
        hour = "12";
    }
    return hour + dateTime.toString(":mmtt").toLowerCase();
}

