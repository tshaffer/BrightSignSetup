var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.11:8080/";

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
    var toAppend = '<div><video id="videoZone" hwz="on" autoplay><source src="20141221T093400.mp4" type="video/mp4"></source></video></div>';
    $("#playVideoPage").append(toAppend);
    $("#footerArea").remove();
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
$(document).ready(function(){
	$("body").keydown(function(e){
		console.log(e.which);
		
		// if(e.which == 9) {
		// 	$("#channelGuide").removeClass("btn-primary");
		// 	$("#recordedShows").addClass("btn-primary");
		// }

        if(e.which === 80) { //'p'
            if(!$("#playIcon").length) {
                var toAppend = '<span id="playIcon" class="glyphicon glyphicon-play controlIcon" aria-hidden="true"></span>';
                $("#videoControlRegion").append(toAppend);
            } else {
                $("#playIcon").remove();
            }
        } else if(e.which === 72) { //'h'
            switchToPage("homePage");
            $("#videoZone").remove();
        } else if(e.which === 32) { //' '
            if(!$("#progressBar").length) {
                var percentComplete = 25;
                var toAppend = '<div id="progressBar" class="meter"><span class="meter-span" style="width: ' + percentComplete + '%;"></span></div>';
                $("#videoControlRegion").append(toAppend);
            } else {
                $("#progressBar").remove();
            }

        }

	});
});