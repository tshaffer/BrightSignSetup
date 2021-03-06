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
            showBSNLoginUI();
        }
        else {
            hideBSNLoginUI();
        }

        var enableSFN = $("#sfnSetupType").is(':checked');
        if (enableSFN) {
            $("#sfnSetup").attr("style", "display: block;");
        }
        else {
            $("#sfnSetup").attr("style", "display: none;");
        }

        updateLogsSettingsUI();
    });

    $("#cbEnablePlaybackLogging").change(function () {
        updateLogsSettingsUI();
    });

    $("#cbEnableEventLogging").change(function () {
        updateLogsSettingsUI();
    });

    $("#cbEnableStateLogging").change(function () {
        updateLogsSettingsUI();
    });

    $("#cbEnableDiagnosticLogging").change(function () {
        updateLogsSettingsUI();
    });

    $("#cbUploadLogsAtSpecificTimeEachDay").change(function () {
        updateLogsSettingsUI();
    });

    $("#cbEnableRemoteSnapshot").change(function () {
        var enableRemoteSnapshots = $("#cbEnableRemoteSnapshot").is(':checked');
        $("#txtBoxRemoteSnapshotInterval").prop("disabled", !enableRemoteSnapshots);
        $("#txtBoxNumSnapshots").prop("disabled", !enableRemoteSnapshots);
        $("#txtBoxJPEGQualityLevel").prop("disabled", !enableRemoteSnapshots);
        $("#cbDisplaySnapshotsPortraitMode").prop("disabled", !enableRemoteSnapshots);
    });

// advanced network setup

    // Unit Configuration
    $("#cbSpecifyHostname").change(function () {
        var enableSpecifyHostname = $("#cbSpecifyHostname").is(':checked');
        $("#txtBoxHostname").prop("disabled", !enableSpecifyHostname);
    });

    $("#cbUseProxy").change(function () {
        var enableUseProxy = $("#cbUseProxy").is(':checked');
        $("#txtBoxProxyAddress").prop("disabled", !enableUseProxy);
        $("#txtBoxProxyPort").prop("disabled", !enableUseProxy);
    });

    //Wired
    $("#rbUseDHCP").change(function () {
        updateConnectionSettingsUI("");
    });
    $("#rbUseStatic").change(function () {
        updateConnectionSettingsUI("");
    });

    //Wireless
    $("#rbUseDHCPWireless").change(function () {
        updateConnectionSettingsUI("Wireless");
    });
    $("#rbUseStaticWireless").change(function () {
        updateConnectionSettingsUI("Wireless");
    });

    // Diagnostics
    $("#cbEnableNetworkDiagnostics").change(function () {
        var enableNetworkDiagnostics = $("#cbEnableNetworkDiagnostics").is(':checked');
        $("#cbTestEthernet").prop("disabled", !enableNetworkDiagnostics);
        $("#cbTestWireless").prop("disabled", !enableNetworkDiagnostics);
        $("#cbTestInternet").prop("disabled", !enableNetworkDiagnostics);
    });
});


function updateLogsSettingsUI() {

    var enableUploadLogs = ($("#bsnSetupType").is(':checked') || $("#sfnSetupType").is(':checked')) && ($("#cbEnablePlaybackLogging").is(':checked') || $("#cbEnableEventLogging").is(':checked') || $("#cbEnableStateLogging").is(':checked') || $("#cbEnableDiagnosticLogging").is(':checked'));
    $("#cbUploadLogsOnStartup").prop("disabled", !enableUploadLogs);
    $("#cbUploadLogsAtSpecificTimeEachDay").prop("disabled", !enableUploadLogs);

    var enableUploadTime = enableUploadLogs && $("#cbUploadLogsAtSpecificTimeEachDay").is(':checked');
    $("#selectUploadTimeHour").prop("disabled", !enableUploadTime);
    $("#selectUploadTimeMinutes").prop("disabled", !enableUploadTime);
}


function updateConnectionSettingsUI(suffix) {
    var useStaticNetworkSettings = $("#rbUseStatic" + suffix).is(':checked');
    $("#txtBoxIPAddress" + suffix).prop("disabled", !useStaticNetworkSettings);
    $("#txtBoxSubnetMask" + suffix).prop("disabled", !useStaticNetworkSettings);
    $("#txtBoxDefaultGateway" + suffix).prop("disabled", !useStaticNetworkSettings);
    $("#txtBoxDNS1" + suffix).prop("disabled", !useStaticNetworkSettings);
    $("#txtBoxDNS2" + suffix).prop("disabled", !useStaticNetworkSettings);
    $("#txtBoxDNS3" + suffix).prop("disabled", !useStaticNetworkSettings);
}

function clearBSNLoginUI() {
    $("#txtBoxBSNAccount")[0].value='';
    $("#txtBoxBSNLogin")[0].value='';
    $("#txtBoxBSNPassword")[0].value='';
}


function showBSNLoginUI() {
    $("#bsnLogin").attr("style", "display: block;");
}


function hideBSNLoginUI() {
    $("#bsnLogin").attr("style", "display: none;");
}


function showBSNSetupUI() {
    $("#labelBSNAccountName").text($("#txtBoxBSNAccount").val());
    $("#bsnSetup").attr("style", "display: block;");
}


function hideBSNSetupUI() {
    $("#bsnSetup").attr("style", "display: none;");
}


function updateBSNGroups(groups) {
    $("#selectBSNGroup").empty();

    $.each(groups, function (index, groupName) {
        $('#selectBSNGroup').append($('<option/>', {
            value: groupName,
            text : groupName
        }));
    });
}


function signInToBSN() {

    var bsnAccount = $("#txtBoxBSNAccount").val();
    var bsnLogin = $("#txtBoxBSNLogin").val();
    var bsnPassword = $("#txtBoxBSNPassword").val();
    var md5OfBSNPassword = md5(bsnPassword).toUpperCase();

    var bsnCredentials = {
        "account": bsnAccount,
        "login": bsnLogin,
        "password": md5OfBSNPassword
    };

    //var baseURL = "http://10.10.212.44:8080/";
    var baseURL= "http://10.1.0.241:8080/"
    var aUrl = baseURL + "bsnSignIn";

    $.get(aUrl, bsnCredentials)
        .done(function (result) {
            console.log("bsnSignIn completed successfully");

            bsUserName = result.bsusername;
            bsPassword = result.bspassword;

            aUrl = baseURL + "bsnGetAllGroups";
               $.get(aUrl, bsnCredentials)
                .done(function(allGroups) {
                    console.log("bsnGetAllGroups completed successfully");
                    hideBSNLoginUI();
                    showBSNSetupUI();
                    updateBSNGroups(allGroups);
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


function signoutFromBSN() {
    hideBSNSetupUI();
    clearBSNLoginUI();
    showBSNLoginUI();
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

    var account = "";
    var user = "";
    var password = "";
    var group = "";
    var baseUrl = "";
    var nextUrl = "";
    var contentCheckInterval = "";
    var enableBasicAuthentication = false;

    if (setupType == "bsn") {

        // TODO - ensure that the user has signed in to BSN
        account = $("#txtBoxBSNAccount").val();
        user = bsUserName;
        password = bsPassword;

        // TODO - how does the script get the base URL for BSN?
        baseUrl = "https://services.brightsignnetwork.com/";
        nextUrl = "/bs/checkforcontent.ashx";
        group = $("#selectBSNGroup").val();
        contentCheckInterval = $("#selectContentCheckFrequency").val();
    }
    else if (setupType == "sfn") {
        user = $("#txtBoxSFNUserName").val();
        password = $("#txtBoxSFNPassword").val();
        enableBasicAuthentication = $("#checkBoxEnableSFNBasicAuthentication").is(':checked');
        baseUrl = $("#txtBoxSFNWebFolder").val();
        nextUrl = "/current-sync.xml";
        contentCheckInterval = $("#selectSFNContentCheckFrequency").val();
    }

    var updateHealthInterval = $("#selectUpdateHealthFrequency").val();

    var enablePlaybackLogging = $("#cbEnablePlaybackLogging").is(':checked');
    var enableEventLogging = $("#cbEnableEventLogging").is(':checked');
    var enableStateLogging = $("#cbEnableStateLogging").is(':checked');
    var enableDiagnosticLogging = $("#cbEnableDiagnosticLogging").is(':checked');

    var uploadLogsOnStartup = $("#cbUploadLogsOnStartup").is(':checked');
    var uploadLogsAtSpecificTimeEachDay = $("#cbUploadLogsAtSpecificTimeEachDay").is(':checked');

    var enablePlaybackLogging = $("#cbEnablePlaybackLogging").is(':checked');

    var enableRemoteSnapshot = $("#cbEnableRemoteSnapshot").is(':checked');
    var deviceScreenShotsInterval = $("#txtBoxRemoteSnapshotInterval").val();
    var deviceScreenShotsCountLimit = $("#txtBoxNumSnapshots").val();
    var deviceScreenShotsQuality = $("#txtBoxJPEGQualityLevel").val();
    var deviceScreenShotsDisplayPortrait = $("#cbDisplaySnapshotsPortraitMode").is(':checked');

    // TODO - how does the script get the URL for the device? / is this the right way to communicate with the BrightScript?
    //var baseURL = "http://10.10.212.44:8080/";
    var baseURL= "http://10.1.0.241:8080/"
    var aUrl = baseURL + "runSetup";

    //var aUrl = "/runSetup";

    var setupParams =
    {
        "setupType": setupType,
        "account": account,
        "user": user,
        "password": password,
        "group": group,
        "enableBasicAuthentication": enableBasicAuthentication,

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

        "deviceScreenShotsEnabled": enableRemoteSnapshot,
        "deviceScreenShotsInterval": deviceScreenShotsInterval,
        "deviceScreenShotsCountLimit": deviceScreenShotsCountLimit,
        "deviceScreenShotsQuality": deviceScreenShotsQuality,
        "deviceScreenShotsDisplayPortrait": deviceScreenShotsDisplayPortrait,

        "idleScreenColor": "FF000000",

        "useCustomSplashScreen": "False",

        "BrightWallName": "",
        "BrightWallScreenNumber": "",

        "baseUrl": baseUrl,
        "nextUrl": nextUrl,
        "recovery_handler": "/recovery/recovery.ashx",
        "recovery_setup": "/recovery/recovery_runsetup_ba.brs",
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

var modalDialogDisplayed = false;
function displayAdvancedNetworkDlg() {

    var options = {
        "backdrop": "true"
    }
    $('#advancedNetworkDlg').modal(options);
    $('#advancedNetworkDlgTitle').html('Advanced Network Setup');

    modalDialogDisplayed = true;
    selectedAdvancedNetworkDlgElement = "#advancedNetworkDlgDelete";
    unselectedAdvancedNetworkDlgElement = "#advancedNetworkDlgClose";

    // when dialog is displayed, highlight Delete, unhighlight Close
    $(selectedAdvancedNetworkDlgElement).removeClass("btn-secondary");
    $(selectedAdvancedNetworkDlgElement).addClass("btn-primary");

    $(unselectedAdvancedNetworkDlgElement).removeClass("btn-primary");
    $(unselectedAdvancedNetworkDlgElement).addClass("btn-secondary");
}


function advancedNetworkDlgCloseInvoked() {
    console.log("advancedNetworkDlgCloseInvoked");
    $('#advancedNetworkDlg').modal('hide');
    modalDialogDisplayed = false;
}
