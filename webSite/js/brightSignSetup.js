/**
 * Created by Ted Shaffer on 10/5/2015.
 */
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
            $("#bsnLogin").attr("style", "display: block;");
            //$("#bsnSetup").attr("style", "display: block;");
        }
        else {
            $("#bsnLogin").attr("style", "display: none;");
            //$("#bsnSetup").attr("style", "display: none;");
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


function signInToBSN() {

    var bsnAccount = $("#txtBoxBSNAccount").val();
    var bsnLogin = $("#txtBoxBSNLogin").val();
    var bsnPassword = $("#txtBoxBSNPassword").val();
    var bsnObfuscatedPassword = "870FA8EE962D90AF50C7EAED792B075A";

    var bsnCredentials = {
        "account": bsnAccount,
        "login": bsnLogin,
        "password": bsnObfuscatedPassword
    };

    var baseURL = "http://10.10.212.44:8080/";
    var aUrl = baseURL + "bsnSignIn";

    $.get(aUrl, bsnCredentials)
        .done(function (result) {
            console.log("bsnSignIn completed successfully");

            aUrl = baseURL + "bsnGetAllGroups";
               $.get(aUrl, bsnCredentials)
                .done(function(allGroups) {
                    console.log("bsnGetAllGroups completed successfully");
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    debugger;
                    console.log("bsnSignIn failure");
                })
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("bsnSignIn failure");
        })
        .always(function () {
            //alert("runSetup transmission finished");
        });
}


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

    var setupType = $("input[name=setupType]:checked").val();

    var lwsConfig = "none";
    if (setupType == "lfn") {
        lwsConfig = "content";
    }
    else if (enableLWS) {
        lwsConfig = "status";
    }

    var bsnGroup = $("#selectBSNGroup").val();
    var contentCheckInterval = $("#selectContentCheckFrequency").val();
    var updateHealthInterval = $("#selectUpdateHealthFrequency").val();

    var enablePlaybackLogging = $("#checkBoxEnablePlaybackLogging").is(':checked');
    var enableEventLogging = $("#checkBoxEnableEventLogging").is(':checked');
    var enableStateLogging = $("#checkBoxEnableStateLogging").is(':checked');
    var enableDiagnosticLogging = $("#checkBoxEnableDiagnosticLogging").is(':checked');

    var uploadLogsOnStartup = $("#checkBoxUploadLogsOnStartup").is(':checked');
    var uploadLogsAtSpecificTimeEachDay = $("#checkBoxUploadLogsAtSpecificTimeEachDay").is(':checked');


    var baseURL = "http://10.10.212.44:8080/";
    var aUrl = baseURL + "runSetup";

    //var aUrl = "/runSetup";

    var setupParams =
    {
        "setupType": setupType,
        "account": "ted",
        "user": "teduser",
        "password": "tedpwd",
        "group": bsnGroup,
        "timezone": timeZone,
        "unitName": unitName,
        "unitNamingMethod": customization,
        "unitDescription": unitDescription,

        "timeBetweenNetConnects": contentCheckInterval,
        "contentDownloadsRestricted": "no",
        "contentDownloadRangeStart": "0",
        "contentDownloadRangeLength": "0",

        "timeBetweenHeartbeats": updateHealthInterval,
        "heartbeatsRestricted": "no",
        "heartbeatsRangeStart": "0",
        "heartbeatsRangeLength": "0",

        "timeServer": timeServer,

        "specifyHostname": "no",
        "hostname": "",

        "useWireless": enableWireless,
        "ssid": ssid,
        "passphrase": securityKey,

        "networkConnectionPriorityWired": "0",
        "contentDataTypeEnabledWired": "True",
        "textFeedsDataTypeEnabledWired": "True",
        "healthDataTypeEnabledWired": "True",
        "mediaFeedsDataTypeEnabledWired": "True",
        "logUploadsDataTypeEnabledWired": "True",

        "networkConnectionPriorityWireless": "1",
        "contentDataTypeEnabledWireless": "True",
        "textFeedsDataTypeEnabledWireless": "True",
        "healthDataTypeEnabledWireless": "True",
        "mediaFeedsDataTypeEnabledWireless": "True",
        "logUploadsDataTypeEnabledWireless": "True",

        "useDHCP": "yes",
        "staticIPAddress": "",
        "subnetMask": "",
        "gateway": "",
        "dns1": "",
        "dns2": "",
        "dns3": "",

        "dwsEnabled": enableDWS,
        "dwsPassword": dwsPassword,

        "lwsConfig": lwsConfig,
        "lwsUserName": "",
        "lwsPassword": "",
        "lwsEnableUpdateNotifications": "yes",

        "playbackLoggingEnabled": enablePlaybackLogging,
        "eventLoggingEnabled": enableEventLogging,
        "stateLoggingEnabled": enableStateLogging,
        "diagnosticLoggingEnabled": enableDiagnosticLogging,
        "variableLoggingEnabled": "yes",
        "uploadLogFilesAtBoot": uploadLogsOnStartup,
        "uploadLogFilesAtSpecificTime": uploadLogsAtSpecificTimeEachDay,
        "uploadLogFilesTime": "",

        "deviceScreenShotsEnabled": "yes",
        "deviceScreenShotsInterval": "60",
        "deviceScreenShotsCountLimit": "25",
        "deviceScreenShotsQuality": "100",
        "deviceScreenShotsDisplayPortrait": "False",

        "idleScreenColor": "FF000000",

        "useCustomSplashScreen": "False",

        "BrightWallName": "",
        "BrightWallScreenNumber": "",

        "base": "https://services.brightsignnetwork.com/",
        "recovery_handler": "/recovery/recovery.ashx",
        "recovery_setup": "/recovery/recovery_runsetup_ba.brs",
        "next": "/bs/checkforcontent.ashx",
        "event": "/bs/events.ashx",
        "error": "/bs/error.ashx",
        "deviceerror": "/bs/deviceerror.ashx",
        "devicedownload": "/bs/devicedownload.ashx",
        "devicedownloadprogress": "/bs/devicedownloadprogress.ashx",
        "trafficdownload": "/bs/trafficdownload.ashx",
        "uploadusage": "/bs/uploadusage.ashx",
        "batteryCharger": "/bs/batteryCharger.ashx",
        "heartbeat": "/bs/heartbeat.ashx",
        "uploadLogs": "/bs/uploadlogs.ashx",

        "networkDiagnosticsEnabled": "False",
        "testEthernetEnabled": "True",
        "testWirelessEnabled": "False",
        "testInternetEnabled": "True",

    };

    $.get(aUrl, setupParams)
        .done(function (result) {
            console.log("runSetup sent successfully");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            debugger;
            console.log("runSetup failure");
        })
        .always(function () {
            //alert("runSetup transmission finished");
        });
}


