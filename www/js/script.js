var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.26:8080/";

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
    .done(function(shows) {
        var toAppend = "";
        var result = [ {"series": "The Good Wife", "episode": "episode 1", "recordedDate": "12/25/14", "lastPlayedDate": "n/a", "duration": "30", "channel": "6"},
            {"series" : "Brooklyn Nine-Nine", "episode": "episode 3", "recordedDate": "12/25/14", "lastPlayedDate": "n/a", "duration": "30", "channel": "6"},
            {"series": "HIMYM", "episode": "episode 10", "recordedDate": "12/25/14", "lastPlayedDate": "n/a", "duration": "30", "channel": "6"} ];    

        // sort data by series name alphabetically
        result.sort(function(a, b) {
                if (a.series < b.series) return -1;
                else if (a.series > b.series) return 1;
                else return 0;
        });

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr><td><button type='button' class='btn btn-default' aria-label='Left Align'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'></span></button></td>" +
            "<td>" + result[i].series + "</td>" +
            "<td>" + result[i].episode + "</td>" + 
            "<td>" + result[i].recordedDate + "</td>" + 
            "<td>" + result[i].lastPlayedDate + "</td>" + 
            "<td>" + result[i].duration + "</td>" + 
            "<td>" + result[i].channel + "</td></tr>";
        }
        // is there a reason do this all at the end instead of once for each row?
        $("#recordedShowsTableBody").append(toAppend);

        /*
        var toAppend = "";

        for (i = 0; i < result.length; i++) {
            toAppend += "<tr onclick=\"recordedShowDetails(\'" + result[i].showId + "\')\" id=\"recordedShowRow" +  i + " \"><td><p class=\"btn btn-primary\">a title</p></td><td>a recorded date</td><td>a last played date</td></tr>";
        }
        $("#recordedShowsTableBody").append(toAppend);
        */
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
		//console.log(e);
		//console.log(e.which);
		if(e.which == 9) {
			$("#channelGuide").removeClass("btn-primary");
			$("#recordedShows").addClass("btn-primary");
		}
	});
});