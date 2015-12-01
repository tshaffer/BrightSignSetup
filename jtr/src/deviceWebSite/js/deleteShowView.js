/**
 * Created by tedshaffer on 12/1/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating deleteShowView module");

    var deleteShowView = Backbone.View.extend({

        _showRecordingId: -1,
        selectedDeleteShowDlgElement: "",
        unselectedDeleteShowDlgElement: "",

        initialize: function () {
            console.log("cgDeleteShowView::initialize");
        },

        show: function(showTitle, showRecordingId) {

            consoleLog("displayDeleteShowDlg() invoked, showTitle=" + showTitle + ", showRecordingId=" + showRecordingId);

            this._showRecordingId = showRecordingId;

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
        },

        deleteShowDlgCloseInvoked: function() {
            console.log("deleteShowDlgCloseInvoked");
            $('#deleteShowDlg').modal('hide');
        },

        deleteShowDlgDeleteInvoked: function() {
            console.log("deleteShowDlgDeleteInvoked");
            $('#deleteShowDlg').modal('hide');
            executeDeleteSelectedShow(_showRecordingId);
        },






    });

});
