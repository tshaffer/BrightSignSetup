/**
 * Created by tedshaffer on 10/25/15.
 */
define(function() {
    $(document).ready(function () {
        require(['serverInterface','channelGuideController','mainMenuController','manualRecordController','recordedShowsController'],
            function(ServerInterface,ChannelGuideController,MainMenuController,ManualRecordController,RecordedShowsController) {

                console.log("all controllers loaded");

                // perform additional initialization tasks
                ChannelGuideController.setServerInterface(ServerInterface);
                ManualRecordController.setServerInterface(ServerInterface);
                RecordedShowsController.setServerInterface(ServerInterface);

                // maybe put me somewhere else
                ChannelGuideController.retrieveData();
            });
    });
});
