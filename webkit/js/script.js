var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.11:8080/";

var bsMessage;

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
}
 
function selectUserSelection() {

}

function selectHomePage() {
	switchToPage("homePage");
}

function here (argument) {
	console.log(argument);
}

function selectPlayVideo() {
    switchToPage("playVideoPage");
    playVideo();
}

function playVideo () {
//    var toAppend = '<div><video id="videoZone" hwz="on" hwz="z-index:-1" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
//    var toAppend = '<div><video id="videoZone" hwz="z-index:-1" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
//    var toAppend = '<div><video id="videoZone" hwz="on" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
//    var toAppend = '<div><video id="videoZone" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
//    var toAppend = '<div><video id="videoZone" hwz="on" hwz="z-index:-1" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
//    var toAppend = '<div><p>hello ted</p><br><video id="videoZone" hwz="on" hwz="z-index:-1" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
    var toAppend = '<div><p>hello ted</p><br><video id="videoZone" hwz="z-index:-1" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
    $("#playVideoPage").append(toAppend);
    $("#footerArea").remove();
}

function pauseVideo() {
    console.log("entering pauseVideo");

    var paused = $('#videoZone')[0].paused;
    console.log("video paused is " + paused.toString());
    if (paused.toString() == "true") {
        $('#videoZone')[0].play();
    }
    else {
        $('#videoZone')[0].pause();
    }
    var currentTime = $('#videoZone')[0].currentTime;
    console.log("current time is " + currentTime);
}

function quickSkipVideo() {
    console.log("entering quickSkipVideo");
//    var currentTime = $('#videoZone')[0].currentTime;
//    console.log("current time is " + currentTime);
//    currentTime += 10;
//    console.log("set current time to " + currentTime);
//    $('#videoZone')[0].currentTime = currentTime;
//    currentTime = $('#videoZone')[0].currentTime;
//    console.log("now, current time is " + currentTime);

    var duration = $('#videoZone')[0].duration;
    console.log("video duration is " + duration.toString());

    var paused = $('#videoZone')[0].paused;
    console.log("video paused is " + paused.toString());

    console.log("Video Start: " + $('#videoZone')[0].seekable.start(0) + " End: " + $('#videoZone')[0].seekable.end(0));

    var startDate = $('#videoZone')[0].startDate;
    console.log("video startDate is " + startDate.toString());

    var startDate = $('#videoZone')[0].volume;
    console.log("video volume is " + volume.toString());

}

function togglePlayIcon() {
    console.log("script.js:: togglePlayIcon invoked");
    if (!$("#playIcon").length) {
        console.log("script.js:: display play icon");
        var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
        $("#videoControlRegion").append(toAppend);
    } else {
        console.log("script.js:: remove play icon");
        $("#playIcon").remove();
    }
}

function toggleProgressBar() {
    if (!$("#progressBar").length) {
        var percentComplete = 25;
        var toAppend = '<div id="progressBar" class="meter"><span class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
        $("#videoControlRegion").append(toAppend);
    } else {
        $("#progressBar").remove();
    }
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

function createManualRecording() {

    var date = $("#manualRecordDate").val();
    var time = $("#manualRecordTime").val();
    var dateObj = new Date(date + " " + time);
    var duration = $("#manualRecordDuration").val();
    var channel = $("#manualRecordChannel").val();
    var useTuner = !$("#manualRecordAuxInCheckbox").is(':checked');
    var title = $("#manualRecordTitle").val();
    if(!title) {
        title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
        if(useTuner) {
            title += " " + channel;
        } else {
            title += " Aux-In";
        }
    }
	
	var aUrl = baseURL + "manualRecord";
	var recordData = {"year" : dateObj.getFullYear(), "month" : dateObj.getMonth(), "day" : dateObj.getDate(), "startTimeHours" : dateObj.getHours(), "startTimeMinutes" : dateObj.getMinutes(), "duration" : duration, "channel" :  channel, "title" : title, "useTuner" : useTuner}

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

function getRecordedShows() {
	var aUrl = baseURL + "recordedShows";

    $.ajax({
        type: "GET",
        url: aUrl
    })
    .done(function( result ) {
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr onclick=\"recordedShowDetails(\'" + result[i].showId + "\')\" id=\"recordedShowRow" +  i + " \"><td><p class=\"btn btn-primary\">a title</p></td><td>a recorded date</td><td>a last played date</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
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
    bsMessage.PostBSMessage({ message: "switch to " + newPage });

    var newPageId = "#" + newPage;
	$(currentActiveElementId).css("display" ,"none");
	currentActiveElementId = newPageId;
	$(currentActiveElementId).removeAttr("style");
	if(currentActiveElementId == "#homePage") {
		$("#footerArea").empty();
	} else {
		$("#footerArea").append("<button class=\"btn btn-primary\" onclick=\"selectHomePage()\">Home</button><br><br>");
	}
}


//keyboard event listener
$(document).ready(function () {

    console.log("JTR javascript .ready invoked");

    // message port
    bsMessage = new BSMessagePort();
    console.log("typeof bsMessage is " + typeof bsMessage);
    bsMessage.PostBSMessage({ message: "javascript ready" });

    bsMessage.onbsmessage = function (msg) {
        console.log("onbsmessage invoked");
        for (name in msg.data) {
            console.log('### ' + name + ': ' + msg.data[name]);

            if (name == "bsMessage") {
                if (msg.data[name] == "play") {
                    switchToPage("playVideoPage");
                    playVideo();
                }
                else if (msg.data[name] == "pause") {
                    pauseVideo();
                }
                else if (msg.data[name] == "quickSkip") {
                    quickSkipVideo();
                }
                else if (msg.data[name] == "togglePlayIcon") {
                    togglePlayIcon();
                }
                else if (msg.data[name] == "toggleProgressBar") {
                    toggleProgressBar();
                }
            }
        }
    }

    // ir receiver
    var ir_receiver = new BSIRReceiver();

    ir_receiver.onremotedown = function (e) {
        switchToPage("manualRecordPage");
        console.log('############ onremotedown: ' + e.irType + " - " + e.code);
    }

    ir_receiver.onremoteup = function (e) {
        switchToPage("recordedShowsPage");
        console.log('############ onremoteup: ' + e.irType + " - " + e.code);
    }

    $("body").keydown(function (e) {
        console.log(e.which);

        // if(e.which == 9) {
        // 	$("#channelGuide").removeClass("btn-primary");
        // 	$("#recordedShows").addClass("btn-primary");
        // }

        if (e.which === 80) { //'p'
            if (!$("#playIcon").length) {
                var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
                $("#videoControlRegion").append(toAppend);
            } else {
                $("#playIcon").remove();
            }
        } else if (e.which === 72) { //'h'
            switchToPage("homePage");
            $("#videoZone").remove();
        } else if (e.which === 32) { //' '
            if (!$("#progressBar").length) {
                var percentComplete = 25;
                var toAppend = '<div id="progressBar" class="meter"><span class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
                $("#videoControlRegion").append(toAppend);
            } else {
                $("#progressBar").remove();
            }

        }

    });
});