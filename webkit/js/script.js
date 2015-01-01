var currentActiveElementId = "#homePage";
var baseURL = "http://192.168.2.11:8080/";
//var baseURL = "http://10.1.0.134:8080/";

var bsMessage;
var recordedPageIds = [];

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

function navigateRecordedShowsPage(navigationCommand$) {

    console.log("navigateRecordedShowsPage entry");

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    if (currentElementId == "" || currentElementId == "recordedShows") {
        rowIndex = 0;
        colIndex = 0;
    }
    else {
        currentElementId = "#" + currentElementId;
        for (i = 0; i < recordedPageIds.length; i++) {

            var recordingId = recordedPageIds[i][0];
            var deleteId = recordedPageIds[i][1];

            if (recordingId == currentElementId) {
                rowIndex = i;
                colIndex = 0;
                break;
            }
            else if (deleteId == currentElementId) {
                rowIndex = i;
                colIndex = 1;
                break;
            }
        }

        switch (navigationCommand$) {
            case "Up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "Down":
                if (rowIndex < recordedPageIds.length) rowIndex++;
                break;
            case "Left":
                if (colIndex > 0) colIndex--;
                break;
            case "Right":
                if (colIndex < 1) colIndex++;
                break;
        }
    }

    $(recordedPageIds[rowIndex][colIndex]).focus();
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

var mainMenuIds = [
    ['channelGuide', 'setManualRecord'],
    ['recordedShows', 'userSelection'],
    ['toDoList', 'myPlayVideo']
];

function navigateHomePage(navigationCommand$) {

    var rowIndex = -1;
    var colIndex = -1;

    var currentElement = document.activeElement;
    var currentElementId = currentElement.id;

    for (i = 0; i < mainMenuIds.length; i++) {
        for (j = 0; j < mainMenuIds[i].length; j++) {
            if (mainMenuIds[i][j] == currentElementId) {
                rowIndex = i;
                colIndex = j;
                break;
            }
            // break again if necessary?
        }
    }

    if (rowIndex >= 0 && colIndex >= 0) {
        switch (navigationCommand$) {
            case "Up":
                if (rowIndex > 0) rowIndex--;
                break;
            case "Down":
                if (rowIndex < mainMenuIds.length) rowIndex++;
                break;
            case "Left":
                if (colIndex > 0) colIndex--;
                break;
            case "Right":
                if (colIndex < mainMenuIds[0].length) colIndex++;
                break;
        }
    }
    else {
        rowIndex = 0;
        colIndex = 0;
    }

    var newElementId = "#" + mainMenuIds[rowIndex][colIndex];
     $(newElementId).focus();
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


function executeRecordedShowAction(actionButtonId) {
    if (actionButtonId.lastIndexOf("recording") === 0) {
        console.log("selected recording");
        var recordingId = actionButtonId.substring("recording".length);
        executePlaySelectedShow(recordingId);
    }
    else if (actionButtonId.lastIndexOf("delete") === 0) {
        console.log("selected delete");
        var recordingId = actionButtonId.substring("delete".length);
        executeDeleteSelectedShow(recordingId);
    }
    else {
        console.log("executeRecordedShowAction - no matching action found for " + actionButtonId);
    }
}

function playSelectedShow(event) {
    var recordingId = event.data.recordingId;
    executePlaySelectedShow(recordingId);
}

function executePlaySelectedShow(recordingId)
{
    console.log("executePlaySelectedShow " + recordingId);

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


function deleteSelectedShow(event) {
    var recordingId = event.data.recordingId;
    executeDeleteSelectedShow(recordingId);
}

function executeDeleteSelectedShow(recordingId)
{
    console.log("executeDeleteSelectedShow " + recordingId);

    var aUrl = baseURL + "deleteRecording";

    var deleteRecordingData = { "recordingId": recordingId };

    $.get(aUrl, deleteRecordingData)
        .done(function (result) {
            console.log("deleteRecording successfully sent");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("deleteRecording failure");
        })
        .always(function () {
            alert("deleteRecording transmission finished");
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

            $("#recordedShowsTableBody").empty();

            var firstLine = true;

            $.each(jtrRecordings, function (index, jtrRecording) {
                if (firstLine) {
                    toAppend += "<tr><td><button type='button' class='btn btn-default' id='recording" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-play-circle' aria-hidden='true' autofocus></span></button></td>";
                }
                else {
                    toAppend += "<tr><td><button type='button' class='btn btn-default' id='recording" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'></span></button></td>";
                }

                toAppend += "<td><button type='button' class='btn btn-default' id='delete" + jtrRecording.recordingId + "' aria-label='Left Align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></button></td>" +
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

                firstLine = false;
            });

            // is there a reason do this all at the end instead of once for each row?
            $("#recordedShowsTableBody").append(toAppend);

            recordedPageIds.length = 0;

            // add button handlers for each recording - note, the handlers need to be added after the html has been added!!
            $.each(recordingIds, function (index, recordingId) {

                // play a recording
                var btnIdRecording = "#recording" + recordingId;
                $(btnIdRecording).click({ recordingId: recordingId }, playSelectedShow);

                // delete a recording
                var btnIdDelete = "#delete" + recordingId;
                $(btnIdDelete).click({ recordingId: recordingId }, deleteSelectedShow);

                var recordedPageRow = [];
                recordedPageRow.push(btnIdRecording);
                recordedPageRow.push(btnIdDelete);
                recordedPageIds.push(recordedPageRow);
            });

            $(recordedPageIds[0][0]).focus();
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
                var command$ = msg.data[name];
                if (command$ == "showMenu") {
                    console.log("selectHomePage");
                    selectHomePage();
                    $("#footerArea").removeAttr("style");
                    // $("#footerArea").css("display", "block");

                    // give focus to first element
                    var elementId = "#" + mainMenuIds[0][0];
                    $(elementId).focus();

                }
                else if (command$ == "exitUI") {
                    eraseUI();
                }
                else if (command$ == "togglePlayIcon") {
                    togglePlayIcon();
                }
                else if (command$ == "toggleProgressBar") {
                    toggleProgressBar();
                }
                else if (command$ == "Up" || command$ == "Down" || command$ == "Left" || command$ == "Right") {
                    console.log("currentActiveElementId is " + currentActiveElementId);
                    switch (currentActiveElementId) {
                        case "#homePage":
                            console.log("navigation entered while homePage visible");
                            navigateHomePage(command$)
                            break;
                        case "#recordedShowsPage":
                            console.log("navigation entered while recordedShowsPage visible");
                            navigateRecordedShowsPage(command$)
                            break;
                    }
                }
                else if (command$ = "Enter") {
                    switch (currentActiveElementId) {
                        case "#homePage":
                            var currentElement = document.activeElement;
                            var currentElementId = currentElement.id;
                            console.log("active home page item is " + currentElementId);
                            switch (currentElementId) {
                                case "channelGuide":
                                    selectChannelGuide();
                                    break;
                                case "setManualRecord":
                                    selectSetManualRecord();
                                    break;
                                case "recordedShows":
                                    selectRecordedShows();
                                    break;
                                case "userSelection":
                                    selectUserSelection();
                                    break;
                                case "toDoList":
                                    selectToDoList();
                                    break;
                                case "myPlayVideo":
                                    break;
                            }
                            break;
                        case "#recordedShowsPage":
                            var currentElement = document.activeElement;
                            var currentElementId = currentElement.id;
                            console.log("active recorded shows page item is " + currentElementId);
                            executeRecordedShowAction(currentElementId);
                            break;
                    }
                }
            }
        }
    }

    // ir receiver
    //    var ir_receiver = new BSIRReceiver();
    //    var ir_receiver = new BSIRReceiver("Iguana", "NEC");
    //    console.log("typeof ir_receiver is " + typeof ir_receiver);

    //    ir_receiver.onremotedown = function (e) {
    //        console.log('############ onremotedown: ' + e.irType + " - " + e.code);
    //    }

    //    ir_receiver.onremoteup = function (e) {
    //        console.log('############ onremoteup: ' + e.irType + " - " + e.code);
    //    }

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