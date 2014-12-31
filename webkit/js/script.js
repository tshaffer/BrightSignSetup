var currentActiveElementId = "#homePage";
//var baseURL = "http://192.168.2.11:8080/";
var baseURL = "http://10.1.0.134:8080/";
var bsMessage;
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
}
 
function selectUserSelection() {

}

function selectHomePage() {
	switchToPage("homePage");
}

function here (argument) {
	console.log(argument);
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


function playSelectedShow(event) {
    var recordingId = event.data.recordingId;
    console.log("playSelectedShow " + recordingId);

    var aUrl = baseURL + "recording";

    var recordingData = { "recordingId": recordingId };

    $.get(aUrl, recordingData)
        .done(function (result) {
            console.log("recording successfully sent");
            eraseUI();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("recording failure");
        })
        .always(function () {
            alert("recording transmission finished");
        });
}


function getRecordedShows() {
    var aUrl = baseURL + "recordings";

    $.ajax({
        type: "GET",
        url: aUrl,
        dataType: "xml",
        success: function (xml) {
            var recordings = XML2JSON(xml);
            var jtrRecordings = recordings.BrightSignRecordings.BrightSignRecording;

            var toAppend = "";
            var recordingIds = [];

            $.each(jtrRecordings, function (index, jtrRecording) {
                toAppend += "<tr><td><button type='button' class='btn btn-default' id='recording" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'></span></button></td>" +
                //                "<td>" + result[i].series + "</td>" +
                //                "<td>" + result[i].episode + "</td>" +
                "<td>" + jtrRecording.title + "</td>" +
                "<td>" + "" + "</td>" +
                "<td>" + jtrRecording.startDateTime + "</td>" +
                //                "<td>" + result[i].lastPlayedDate + "</td>" +
                "<td>" + "" + "</td>" +
                "<td>" + jtrRecording.duration + "</td>" +
                //                "<td>" + result[i].channel + "</td></tr>";
	            "<td>" + "" + "</td></tr>";

                recordingIds.push(jtrRecording.recordingId);
            });

            // is there a reason do this all at the end instead of once for each row?
            $("#recordedShowsTableBody").append(toAppend);

            // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
            $.each(recordingIds, function (index, recordingId) {
                var btnId = "#recording" + recordingId;
                $(btnId).click({ recordingId: recordingId }, playSelectedShow);
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


function eraseUI() {
    $(currentActiveElementId).css("display", "none");
    $("#footerArea").css("display", "none");
//    $("#footerArea").removeAttr("style");
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
                if (msg.data[name] == "showMenu") {
                    console.log("selectHomePage");
                    selectHomePage();
                    $("#footerArea").removeAttr("style");
                    // $("#footerArea").css("display", "block");
                }
                else if (msg.data[name] == "exitUI") {
                    eraseUI();
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
//    var ir_receiver = new BSIRReceiver();
    var ir_receiver = new BSIRReceiver("Iguana", "NEC");
    console.log("typeof ir_receiver is " + typeof ir_receiver);

    ir_receiver.onremotedown = function (e) {
        console.log('############ onremotedown: ' + e.irType + " - " + e.code);
    }

    ir_receiver.onremoteup = function (e) {
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