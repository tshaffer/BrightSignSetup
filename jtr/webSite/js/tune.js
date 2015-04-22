function tuneChannel(channel, saveChannelToDB) {

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
        consoleLog("Send NEC " + irCode);
        ir_transmitter.Send("NEC", irCode);
    }
}



