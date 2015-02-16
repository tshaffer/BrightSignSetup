
var currentActiveElementId = "#homePage";
//var baseURL = "http://192.168.2.6:8080/";
//var baseURL = "http://192.168.2.7:8080/";
//var baseURL = "http://192.168.2.12:8080/";
//var baseURL = "http://10.1.0.90:8080/";
var baseURL;

var converter;  //xml to JSON singleton object

function XML2JSON(xml) {
    if (!converter) {
        converter = new X2JS();
    }
    return converter.xml2json(xml);
}


function setNav() {

}


function selectChannelGuide() {

}

function selectRecordedShows() {
	switchToPage("recordedShowsPage");
	getRecordedShows();
}

function selectToDoList() {
	switchToPage("toDoListPage");
	getToDoList();
}

function selectSetManualRecord() {
	switchToPage("manualRecordPage");
	setDefaultDateTimeFields();
	$("#manualRecordTitle").focus();
}
 
function selectUserSelection() {

}

function selectHomePage() {
	switchToPage("homePage");
}

function executeRemoteCommand(endPoint) {

    var aUrl = baseURL + endPoint;

    $.get(aUrl, {})
        .done(function (result) {
            console.log("remote command successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("remote command failure");
        })
        .always(function () {
            //alert("remote command transmission finished");
        });
}

function remotePause() {

    console.log("remotePause");
    executeRemoteCommand("pause");
}

function remotePlay() {

    console.log("remotePlay");
    executeRemoteCommand("play");
}

function remoteRewind() {

    console.log("remoteRewind");
    executeRemoteCommand("rewind");
}

function remoteFastForward() {

    console.log("remoteFastForward");
    executeRemoteCommand("fastForward");
}

function remoteInstantReplay() {

    console.log("remoteInstantReplay");
    executeRemoteCommand("instantReplay");
}

function remoteQuickSkip() {

    console.log("remoteQuickSkip");
    executeRemoteCommand("quickSkip");
}

function remoteStop() {
    console.log("remoteStop");
}

function here(argument) {
	console.log(argument);
}

function twoDigitFormat(val) {
    val = '' + val;
    if(val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}

function setDefaultDateTimeFields () {
	var date = new Date();

	var toAppendDate = "<input id=\"manualRecordDate\"  type=\"date\" class=\"form-control\" value=\"" +  date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate()) + "\">";
	var toAppendTime = "<input id=\"manualRecordTime\" type=\"time\" class=\"form-control\" value=\"" + twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes()) + "\">";

	if($("#manualRecordDate").length) {   
		$("#manualRecordDate").remove();
		$("#manualRecordTime").remove();
	}

	$("#manualRecordDateId").append(toAppendDate);
	$("#manualRecordTimeId").append(toAppendTime);
}


function getRecordingTitle(dateObj, useTuner, channel) {

    var title = $("#manualRecordTitle").val();
    if (!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if (useTuner) {
            title += " " + channel;
        } else {
            title += " Aux-In";
        }
    }

    return title;
}


function recordNow() {

    // get current date/time - used as title if user doesn't provide one.
    var currentDate = new Date();

    var title = getRecordingTitle(currentDate, false, "");

    var duration = $("#manualRecordDuration").val();
    
    var aUrl = baseURL + "recordNow";
    var recordData = { "duration": duration, "title": title }

    $.get(aUrl, recordData)
        .done(function (result) {
            console.log("record now successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("record now failure");
        })
        .always(function () {
            alert("finished");
        });
}


function createManualRecording() {

    // retrieve date/time from html elements and convert to a format that works on all devices
    var date = $("#manualRecordDate").val();    
    var time = $("#manualRecordTime").val();
    var dateTimeStr = date + " " + time;

    // required for iOS devices - http://stackoverflow.com/questions/13363673/javascript-date-is-invalid-on-ios
    var compatibleDateTimeStr = dateTimeStr.replace(/-/g, '/');

    var bsIsoDateTime = compatibleDateTimeStr.replace(/\//g, '');   // remove slashes
    bsIsoDateTime = bsIsoDateTime.replace(' ', 'T');                // replace space by T
    bsIsoDateTime = bsIsoDateTime.replace(':', '');                 // remove colon

    var dateObj = new Date(compatibleDateTimeStr);

    var useTuner = !$("#manualRecordAuxInCheckbox").is(':checked');

    var duration = $("#manualRecordDuration").val();
    var channel = $("#manualRecordChannel").val();
	
    var title = getRecordingTitle(dateObj, useTuner, channel);

    var aUrl = baseURL + "manualRecord";
    var recordData = { "bsIsoDateTime": bsIsoDateTime, "duration": duration, "channel": channel, "title": title, "useTuner": useTuner }

	$.get(aUrl, recordData)
        .done(function (result) {
            console.log("manual record successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("manual record failure");
        })
        .always(function () {
            alert("finished");
        });
}


function playSelectedShow(event) {

    var recordingId = event.data.recordingId;
    console.log("playSelectedShow " + recordingId);

    // save selected show in local storage
    //localStorage.setItem("lastSelectedShowId", recordingId.toString());

    // save lastSelectedShowId in server's persistent memory
    var parts = [];
    parts.push("lastSelectedShowId" + '=' + recordingId.toString());
    var paramString = parts.join('&');

    var url = baseURL + "lastSelectedShow";

    $.post(url, paramString);

    // launch playback
    var aUrl = baseURL + "recording";
    var recordingData = { "recordingId": recordingId };

    $.get(aUrl, recordingData)
        .done(function (result) {
            console.log("recording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("recording failure");
        })
        .always(function () {
            //alert("recording transmission finished");
        });

}


function deleteSelectedShow(event) {
    var recordingId = event.data.recordingId;
    console.log("deleteSelectedShow " + recordingId);

    var aUrl = baseURL + "deleteRecording";

    var deleteRecordingData = { "recordingId": recordingId };

    $.get(aUrl, deleteRecordingData)
        .done(function (result) {
            console.log("deleteRecording successfully sent");
            getRecordedShows();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("deleteRecording failure");
        })
        .always(function () {
            //alert("deleteRecording transmission finished");
        });
}


function addRecordedShowsLine(jtrRecording) {

    /*
        Play icon
        Delete icon
        Title
        Date
        Day of week
        Info icon
        Position
    */

    var weekday = new Array(7);
    weekday[0] = "Sun";
    weekday[1] = "Mon";
    weekday[2] = "Tue";
    weekday[3] = "Wed";
    weekday[4] = "Thu";
    weekday[5] = "Fri";
    weekday[6] = "Sat";

    var dt = jtrRecording.StartDateTime;
    var n = dt.indexOf(".");
    var formattedDayDate;
    if (n >= 0) {
        var dtCompatible = dt.substring(0, n);
        var date = new Date(dtCompatible);
        formattedDayDate = weekday[date.getDay()] + " " + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
    }
    else {
        formattedDayDate = "poop";
    }

    var lastViewedPositionInMinutes = Math.floor(jtrRecording.LastViewedPosition / 60);
    var position = lastViewedPositionInMinutes.toString() + " of " + jtrRecording.Duration.toString() + " minutes";

    var toAppend =
        "<tr>" +
        "<td><button type='button' class='btn btn-default recorded-shows-icon' id='recording" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-play' aria-hidden='true'></span></button></td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='delete" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>" +
        "<td>" + jtrRecording.Title + "</td>" +
        "<td>" + formattedDayDate + "</td>" +
	    "<td><button type='button' class='btn btn-default recorded-shows-icon' id='delete" + jtrRecording.RecordingId.toString() + "' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button></td>" +
        "<td>" + position + "</td>";

    return toAppend;
}


function getRecordedShows() {
	var aUrl = baseURL + "recordings";

	$.ajax({
	    type: "GET",
	    url: aUrl,
	    dataType: "json",
	    success: function (recordings) {

// convert freespace from disk space to time (approximation) and display it
	        var freeSpace = recordings.freespace;
	        // 44934K per minute - sample 1 - long recording
	        // 43408K per minute - sample 2 - 11 minute recording
	        // use 44Mb per minute
	        var freeSpaceInMegabytes = Number(freeSpace);
	        var freeSpaceInMinutes = Math.floor(freeSpaceInMegabytes / 44);
	        var freeSpaceInHours = Math.floor(freeSpaceInMinutes / 60);

	        var freeSpace = "Free space: ";
	        if (freeSpaceInHours > 0) {
	            if (freeSpaceInHours > 1) {
	                freeSpace += freeSpaceInHours.toString() + " hours";
	            }
	            else {
	                freeSpace += "1 hour";
	            }
	            var partialFreeSpaceInMinutes = freeSpaceInMinutes % (freeSpaceInHours * 60);
	            if (partialFreeSpaceInMinutes > 0) {
	                freeSpace += ", " + partialFreeSpaceInMinutes.toString() + " minutes";
	            }
	        }
	        else {
	            freeSpace += freeSpaceInMinutes.toString() + " minutes";
	        }
	        $("#recordedShowsRemainingSpace").text(freeSpace);

// display show recordings
	        var jtrRecordings = recordings.recordings;

	        var toAppend = "";
	        var recordingIds = [];

	        $("#recordedShowsTableBody").empty();

	        $.each(jtrRecordings, function (index, jtrRecording) {
	            toAppend += addRecordedShowsLine(jtrRecording);
	            recordingIds.push(jtrRecording.RecordingId);
	        });

	        // is there a reason to do this all at the end instead of once for each row?
	        $("#recordedShowsTableBody").append(toAppend);

	        // get last selected show from local storage - navigate to it. null if not defined
	        //var lastSelectedShowId = localStorage.getItem("lastSelectedShowId");
	        var url = baseURL + "lastSelectedShow";

	        $.get(url, {})
                .done(function (result) {
                    console.log("lastSelectedShow successfully sent");
                    var lastSelectedShowId = result;

                    var focusApplied = false;

                    // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
                    $.each(recordingIds, function (index, recordingId) {

                        // play a recording
                        var btnIdRecording = "#recording" + recordingId;
                        $(btnIdRecording).click({ recordingId: recordingId }, playSelectedShow);

                        // delete a recording
                        var btnIdDelete = "#delete" + recordingId;
                        $(btnIdDelete).click({ recordingId: recordingId }, deleteSelectedShow);

                        // highlight the last selected show
                        if (recordingId == lastSelectedShowId) {
                            focusApplied = true;
                            $(btnIdRecording).focus();
                        }
                    });

                    //if (!focusApplied) {
                    //    $(recordedPageIds[0][0]).focus();
                    //}
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("lastSelectedShow failure");
                })
                .always(function () {
                    //alert("remote command transmission finished");
                });

	    }
	});
}


function getToDoList() {
	var aUrl = baseURL + "toDoList";

    $.ajax({
        type: "GET",
        url: aUrl
    })
    .done(function( result ) {
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr id=\"toDoListRow" +  i + " \"><td>date to record</td><td>title</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
    });
}

function recordedShowDetails (showId) {
	// body...
	switchToPage("recordedShowDetailsPage");
	var showTitle = getShowTitle(showId);
	var showDescription = getShowDescription(showId);

	var toAppend = "<h3>" + showTitle + "</h3><br><br>"
        + "<p>" + showDescription + "</p><br><br>" 
        + "<button>Play</button><br><br>"
        + "<button>Delete</button>";

	$("#recordedShowDetailsPage").append(toAppend);
}

function getShowTitle (showId) {
	// body...
}

function getShowDescription (showId) {
	// body...
}

function switchToPage(newPage) {
	var newPageId = "#" + newPage;
	$(currentActiveElementId).css("display" ,"none");
	currentActiveElementId = newPageId;
	$(currentActiveElementId).removeAttr("style");
	if(currentActiveElementId == "#homePage") {
		$("#footerArea").empty();
		$("#trickModeKeys").css("display", "block");
    } else {
		$("#footerArea").append("<button class=\"btn btn-primary\" onclick=\"selectHomePage()\">Home</button><br><br>");
		$("#trickModeKeys").css("display", "none");
    }
}


//keyboard event listener
$(document).ready(function () {

    baseURL = document.baseURI.replace("?","");

    // user agent
    console.log("User Agent: " + navigator.userAgent);

    $("body").keydown(function (e) {
        console.log(e.which);

        // if(e.which == 9) {
        // 	$("#channelGuide").removeClass("btn-primary");
        // 	$("#recordedShows").addClass("btn-primary");
        // }

        //if (e.which === 80) { //'p'
        //    if (!$("#playIcon").length) {
        //        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
        //        $("#videoControlRegion").append(toAppend);
        //    } else {
        //        $("#playIcon").remove();
        //    }
        //} else if (e.which === 72) { //'h'
        //    switchToPage("homePage");
        //    $("#videoZone").remove();
        //} else if (e.which === 32) { //' '
        //    if (!$("#progressBar").length) {
        //        var percentComplete = 50;
        //        var toAppend = '<div id="progressBar" class="meter"><span id="progressBarSpan" class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
        //        toAppend += '<div id="progressBarElapsedTime" class="meterCurrentPositionLabel"><p>1:00</p></div>';
        //        toAppend += '<div id="progressBarTotalTime" class="meterTotalTime"><p>2:00</p></div>';

        //        for (i = 1; i < 8; i++) {
        //            var theId = "progressBarTick" + i.toString()
        //            toAppend += '<div id=' + theId + ' class="meterTick"><p></p></div>';
        //        }
        //        toAppend += '<div id="progressBarTickCurrent" class="meterCurrentPositionTick"><p></p></div>';

        //        $("#videoControlRegion").append(toAppend);
        //    } else {
        //        $("#progressBar").remove();
        //        $("#progressBarTotalTime").remove();
        //        $("#progressBarElapsedTime").remove();
        //        $("#progressBarTickCurrent").remove();

        //        for (i = 1; i < 8; i++) {
        //            var theId = "#progressBarTick" + i.toString()
        //            $(theId).remove();
        //        }
        //    }

        //    var leftOffset = 5;
        //    var rightOffset = 90;
        //    for (i = 1; i < 8; i++) {
        //        var tickOffset = leftOffset + (rightOffset - leftOffset) * i / 8.0;
        //        console.log("tickOffset=" + tickOffset.toString());
        //        $("#progressBarTick" + i.toString()).css({ left: tickOffset.toString() + '%', position: 'absolute' });
        //    }

        //    $("#progressBarSpan").width("75%");
        //}
    });
});