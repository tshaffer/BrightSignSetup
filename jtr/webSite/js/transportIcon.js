var TransportIconSingleton = (function () {
    var transportIconInstance;

    function createTransportIconInstance() {
        var instance = new TransportIcon();
        return instance;
    }

    return {
        getInstance: function () {
            if (!transportIconInstance) {
                transportIconInstance = createTransportIconInstance();
            }
            return transportIconInstance;
        }
    };
})();


function TransportIcon() {

    this.timer = null;

    this.iconVisible = false;
    this.currentIcon = null;

    //glyphicon - play
    //glyphicon - step - backward
    //glyphicon - backward
    //glyphicon - forward
    //glyphicon - step - forward
    //glyphicon - record
    //glyphicon - stop
    //glyphicon - pause

    this.transportIcons = { "record": "glyphicon-record", "play": "glyphicon-play", "pause": "glyphicon-pause", "stop": "glyphicon-stop", "rw": "glyphicon-backward", "ff": "glyphicon-forward", "instantReplay": "glyphicon-step-backward", "quickSkip": "glyphicon-step-forward" };
}


TransportIcon.prototype.displayIcon = function (prefix, iconName, timeoutValue) {

    this.clearTimer();

    if (this.currentIcon != null)
    {
        $("#transportIconSpan").removeClass(this.currentIcon);
    }
    this.currentIcon = this.transportIcons[iconName];
    $("#transportIconSpan").addClass(this.currentIcon);

    if (prefix != null) {
        $("#transportPrefix").text(prefix);
        $("#transportPrefix").show();
    }
    else {
        $("#transportPrefix").hide();
    }

    $("#transportIconButton").show();

    if (arguments.length == 3) {
        this.timer = setTimeout(function () {
            $("#transportIconButton").hide();
            this.timer = null;
        }, timeoutValue);
    }
}


TransportIcon.prototype.eraseIcon = function (iconName, timeoutValue) {

    if (this.currentIcon != null) {
        $("#transportIconButton").hide();
        this.clearTimer();
    }
}


TransportIcon.prototype.clearTimer = function () {

    if (this.timer != null) {
        clearTimeout(this.timer);
        this.timer = null;
    }
}


