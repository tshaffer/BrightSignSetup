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
                // instead of doing the following, just invoke the ServerInterface method to get a promise. then wait for all promises to finish
                ChannelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = ServerInterface.retrieveScheduledRecordings();
                // wait until all data is retrieved??

            });
    });
});
