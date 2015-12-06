/**
 * Created by tedshaffer on 12/1/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating deleteShowView module");

    var deleteShowView = Backbone.View.extend({

        recordingId: -1,
        selectedDeleteShowDlgElement: "",
        unselectedDeleteShowDlgElement: "",

        initialize: function () {
            console.log("cgDeleteShowView::initialize");
        },

        show: function(showTitle, recordingId) {

            console.log("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", recordingId=" + recordingId);

            this.recordingId = recordingId;

            var options = {
                "backdrop": "true"
            }
            $('#deleteShowDlg').modal(options);
            $('#deleteShowDlgShowTitle').html("Delete '" + showTitle + "'?");

            this.selectedDeleteShowDlgElement = "#deleteShowDlgDelete";
            this.unselectedDeleteShowDlgElement = "#deleteShowDlgClose";

            // when dialog is displayed, highlight Delete, unhighlight Close
            $(this.selectedDeleteShowDlgElement).removeClass("btn-secondary");
            $(this.selectedDeleteShowDlgElement).addClass("btn-primary");

            $(this.unselectedDeleteShowDlgElement).removeClass("btn-primary");
            $(this.unselectedDeleteShowDlgElement).addClass("btn-secondary");

            // add handlers
            var self = this;

            $("#deleteShowDlgDelete").click(function (event) {
                self.deleteShowDlgDeleteInvoked();
            });

            $("#deleteShowDlgClose").click(function (event) {
                self.deleteShowDlgCloseInvoked();
            });

            $("#deleteShowDlg").keydown(function (keyEvent) {
                self.toggleHighlightedButton(keyEvent.which);
                return false;
            });
        },

        toggleHighlightedButton: function(keycode) {

            //switch (eventData.toLowerCase(keycode)) {
            //    case "up":
            //    case "down":
            //    case "left":
            //    case "right":
            switch (keycode) {
                case constants.KEY_LEFT:
                case constants.KEY_UP:
                case constants.KEY_RIGHT:
                case constants.KEY_DOWN:

                    console.log("navigation key invoked while modal dialog displayed");

                    // temporary code; make it more general purpose when a second dialog is added
                    //console.log("selected element was: " + selectedDeleteShowDlgElement);

                    $(this.selectedDeleteShowDlgElement).removeClass("btn-primary");
                    $(this.selectedDeleteShowDlgElement).addClass("btn-secondary");

                    $(this.unselectedDeleteShowDlgElement).removeClass("btn-secondary");
                    $(this.unselectedDeleteShowDlgElement).addClass("btn-primary");

                    $(this.unselectedDeleteShowDlgElement).focus();

                    var tmp = this.unselectedDeleteShowDlgElement;
                    this.unselectedDeleteShowDlgElement = this.selectedDeleteShowDlgElement;
                    this.selectedDeleteShowDlgElement = tmp;
            };
        },

        deleteShowDlgDeleteInvoked: function() {
            console.log("deleteShowDlgDeleteInvoked");
            $('#deleteShowDlg').modal('hide');
            this.trigger("deleteSelectedShow", this.recordingId);
        },

        deleteShowDlgCloseInvoked: function() {
            console.log("deleteShowDlgCloseInvoked");
            $('#deleteShowDlg').modal('hide');
        },
    });

    return deleteShowView;
});
