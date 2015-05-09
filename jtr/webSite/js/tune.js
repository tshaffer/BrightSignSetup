﻿function tuneChannel(channel, saveChannelToDB) {

    consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX tuneChannel: channel = " + channel + ", saveChannelToDB=" + saveChannelToDB);

    var originalChannel = channel;

    tuneDigit(channel);

    if (saveChannelToDB) {
        // save lastTunedChannel in db
        var parts = [];
        parts.push("lastTunedChannel" + '=' + originalChannel);
        var paramString = parts.join('&');
        var url = baseURL + "lastTunedChannel";
        $.post(url, paramString);
    }
}

function tuneDigit(channel) {

    if (channel.length > 0) {
        var char = channel.charAt(0);
        consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX tuneDigit: channel = " + channel + ", char=" + char);
        sendIROut(char);
        channel = channel.substr(1);
        if (channel.length == 0) return;
        setTimeout(function () {
            tuneDigit(channel);
        }, 400);
    }
}

function sendIROut(char) {

    var irCode = -1;

    switch (char) {
        case "0":
            irCode = 65295;
            break;
        case "1":
            irCode = 65363;
            break;
        case "2":
            irCode = 65360;
            break;
        case "3":
            irCode = 65296;
            break;
        case "4":
            irCode = 65367;
            break;
        case "5":
            irCode = 65364;
            break;
        case "6":
            irCode = 65300;
            break;
        case "7":
            irCode = 65359;
            break;
        case "8":
            irCode = 65356;
            break;
        case "9":
            irCode = 65292;
            break;
        case "-":
            irCode = 65303;
            break;
    }

    if (irCode > 0) {
        consoleLog("sendIROut: send NEC " + irCode);
        ir_transmitter.Send("NEC", irCode);
    }
}


function retrieveHDMIInputPort(nextFunction, functionParameter) {

    // get settings from db
    var url = baseURL + "hdmiInputPort";
    $.get(url, {})
        .done(function (result) {
            consoleLog("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX retrieveHDMIInputPort success ************************************");
            _hdmiInputPortRetrieved = true;
            _hdmiInputPort = Number(result);
            consoleLog("type of _hdmiInputPort is " + typeof _hdmiInputPort + " and its value is " + _hdmiInputPort);
            nextFunction(functionParameter);
        })
    .fail(function (jqXHR, textStatus, errorThrown) {
        debugger;
        console.log("retrieveHDMIInputPort failure");
    })
    .always(function () {
    });
}


function updateHDMIInputPort() {

    // save hdmiInputPort in db
    var parts = [];
    parts.push("port" + '=' + _hdmiInputPort.toString());
    var paramString = parts.join('&');
    var url = baseURL + "hdmiInputPort";
    $.post(url, paramString);
}


function setUserHDMIInput(input) {

    var port = -1;

    switch (input) {
        case "tuner":
            port = 0;
            break;
        case "roku":
            port = 1;
            break;
        case "tivo":
            port = 2;
            break;
    }
    programHDMIInput(port);
}


function cycleHDMIInputs(up) {

    if (!_hdmiInputPortRetrieved) {
        retrieveHDMIInputPort(executeCycleHDMIInputs, up);
    }
    else {
        executeCycleHDMIInputs(up);
    }
}


function executeCycleHDMIInputs(up) {

    consoleLog("cycleHDMIInputs entry: _hdmiInputPort = " + _hdmiInputPort.toString());

    var targetPort = _hdmiInputPort;
    if (up) {
        targetPort++;
    }
    else {
        targetPort--;
    }
    if (targetPort > _maxHDMIInput) {
        targetPort = 0;
    }
    else if (targetPort < 0) {
        targetPort = _maxHDMIInput;
    }
    programHDMIInput(targetPort);

    consoleLog("cycleHDMIInputs exit: _hdmiInputPort = " + _hdmiInputPort.toString());
}


function programHDMIInput(targetPort) {

    if (!_hdmiInputPortRetrieved) {
        retrieveHDMIInputPort(executeProgramHDMIInput, targetPort);
    }
    else {
        executeProgramHDMIInput(targetPort);
    }
}


function executeProgramHDMIInput(targetPort) {

    consoleLog("696969696969696969696969696969696969696969696969 programHDMIInput(): currentPort=" + _hdmiInputPort.toString() + ", targtePort=" + targetPort.toString());

    if (targetPort == _hdmiInputPort) {
        consoleLog("programHDMIInput(): port == _hdmiInputPort (" + targetPort.toString() + ")");
    }
    else {
        var irCode;
        var upIRCode = 65284;
        var downIRCode = 65280;

        switch (_hdmiInputPort) {
            case 0:
                switch (targetPort) {
                    case 1:                     // 0 -> 1 : up
                        irCode = upIRCode;
                        break;
                    case 2:                     // 0 -> 2 : down
                        irCode = downIRCode;
                        break;
                }
                break;
            case 1:
                switch (targetPort) {
                    case 0:                     // 1 -> 0 : down
                        irCode = downIRCode;
                        break;
                    case 2:                     // 1 -> 2 : up
                        irCode = upIRCode;
                        break;
                }
                break;
            case 2:
                switch (targetPort) {
                    case 0:                     // 2 -> 0 : up
                        irCode = upIRCode;
                        break;
                    case 1:                     // 2 -> 1 : down
                        irCode = downIRCode;
                        break;
                }
                break;
        }
    }

    consoleLog("programHDMIInput: send NEC " + irCode);
    ir_transmitter.Send("NEC", irCode);

    _hdmiInputPort = targetPort;

    updateHDMIInputPort();
}


