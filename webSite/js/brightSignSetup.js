/**
 * Created by Ted Shaffer on 10/5/2015.
 */
function createSetupFiles() {
    console.log("create setup files");

    // retrieve settings
    var unitName = $("#txtBoxUnitName").val();
    var unitDescription = $("#txtBoxUnitDescription").val();
    var customization = $("input[name=customization]:checked").val();

    var enableWireless = $("#checkBoxEnableWireless").is(':checked');
    var ssid = $("#txtBoxSSID").val();
    var securityKey = $("#txtBoxSecurityKey").val();

    var networkConnectionPriority = $("input[name=networkConnectionPriority]:checked").val();

    var timeZone = $("#selectTimeZone").val();
    var timeServer = $("#txtBoxTimeServer").val();

    var enableDWS = $("#checkBoxEnableDWS").is(':checked');
    var dwsPassword = $("#txtBoxDWSPassword").val();

    var enableLWS = $("#checkBoxEnableLWS").is(':checked');
    var lwsUserName = $("#txtBoxLWSUserName").val();
    var lwsPassword = $("#txtBoxLWSPassword").val();

    var bsnGroup = $("#selectBSNGroup").val();
    var contentCheckInterval = $("#selectContentCheckFrequency").val();
    var updateHealthInterval = $("#selectUpdateHealthFrequency").val();

    var enablePlaybackLogging = $("#checkBoxEnablePlaybackLogging").is(':checked');
    var enableEventLogging = $("#checkBoxEnableEventLogging").is(':checked');
    var enableStateLogging = $("#checkBoxEnableStateLogging").is(':checked');
    var enableDiagnosticLogging = $("#checkBoxEnableDiagnosticLogging").is(':checked');

    var uploadLogsOnStartup = $("#checkBoxUploadLogsOnStartup").is(':checked');
    var uploadLogsAtSpecificTimeEachDay = $("#checkBoxUploadLogsAtSpecificTimeEachDay").is(':checked');
}

$(document).ready(function () {
    console.log("hello world");

    // add handlers

    $("#checkBoxEnableWireless").change(function () {
        var enableWireless = $("#checkBoxEnableWireless").is(':checked');
        $("#txtBoxSSID").prop("disabled", !enableWireless);
        $("#txtBoxSecurityKey").prop("disabled", !enableWireless);
    });

    $("#checkBoxEnableDWS").change(function () {
        var enableDWS = $("#checkBoxEnableDWS").is(':checked');
        $("#txtBoxDWSPassword").prop("disabled", !enableDWS);
    });

    $("#checkBoxEnableLWS").change(function () {
        var enableLWS = $("#checkBoxEnableLWS").is(':checked');
        $("#txtBoxLWSUserName").prop("disabled", !enableLWS);
        $("#txtBoxLWSPassword").prop("disabled", !enableLWS);
    });

    setupTypeRadioButtons = $('input[name="setupType"]');
    setupTypeRadioButtons.change(function () {

        var enableBSN = $("#bsnSetupType").is(':checked');
        if (enableBSN) {
            $("#bsnSetup").attr("style", "display: block;");
        }
        else {
            $("#bsnSetup").attr("style", "display: none;");
        }

        var enableSFN = $("#sfnSetupType").is(':checked');
        if (enableSFN) {
            $("#sfnSetup").attr("style", "display: block;");
        }
        else {
            $("#sfnSetup").attr("style", "display: none;");
        }
    });
});
