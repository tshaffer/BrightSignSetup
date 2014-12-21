var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.20:8080/";

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

function setDefaultDateTimeFields () {
	var date = new Date();
	console.log(date);

	var toAppendDate = "<input id=\"manualRecordDate\"  type=\"date\" class=\"form-control\" value=\"" +  date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "\">";
	var toAppendTime = "<input id=\"manualRecordTime\" type=\"time\" class=\"form-control\" value=\"" + date.getHours() + ":" + date.getMinutes() + "\">";

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
	var duration = $("#manualRecordDuration").val();
	var channel = $("#manualRecordChannel").val();

	var dateObj = new Date(date + " " + time);
	var todayObj = new Date();


	//if(todayObj.parse() > dateObj.parse()) {
		//give error -- the specified time is in the past
	//} else {
		var aUrl = baseURL + "manualRecord";
		var recordData = {"year" : dateObj.getFullYear(), "month" : dateObj.getMonth(), "day" : dateObj.getDate(), "startTimeHours" : dateObj.getHours(), "startTimeMinutes" : dateObj.getMinutes(), "duration" : duration, "channel" :  channel}

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


//		$.ajax({
//		    type: 'GET',
//		    data: recordData,
//		    url: aUrl,
//		    error: function () { alert('Failed!'); }
//		})
//	    .done(function (result) {
//	        console.log("manual record successfully sent");
//	        // var toAppend = "";

//	        // for (i = 0; i < result.length; i++) {
//	        //     toAppend += "<tr id=\"recordedShowRow" +  i + " \"><td>a title</td><td>a recorded date</td><td>a last played date</td></tr>";
//	        // }
//	        // $("#recordedShowsTableBody").append(toAppend);
//	    });
//	//}
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
		//console.log(e);
		//console.log(e.which);
		if(e.which == 9) {
			$("#channelGuide").removeClass("btn-primary");
			$("#recordedShows").addClass("btn-primary");
		}
	});
});