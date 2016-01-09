/**
 * Created by tedshaffer on 11/9/15.
 */
function twoDigitFormat(val) {
    val = '' + val;
    if (val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}

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

    // hack to work around apparent date.js bug where hour shows up as 0 inappropriately
    var hour = dateTime.toString("h");
    if (hour == "0") {
        hour = "12";
    }
    return hour + dateTime.toString(":mmtt").toLowerCase();
}

// progress bar
function SecondsToHourMinuteLabel(numSeconds) {

    // convert seconds to hh:mm
    var hours = Math.floor(Number(numSeconds) / 3600).toString();
    hours = twoDigitFormat(hours);

    var minutes = Math.floor((Number(numSeconds) / 60) % 60).toString();
    minutes = twoDigitFormat(minutes);

    return hours + ":" + minutes;
}


function addMilliseconds(date, milliseconds) {
    return new Date(date.getTime() + milliseconds);
}

