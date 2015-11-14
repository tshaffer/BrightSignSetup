/**
 * Created by tedshaffer on 10/25/15.
 */
define(function() {
    $(document).ready(function () {
        require(['serverInterface','settingsController','channelGuideController','mainMenuController','manualRecordController','recordedShowsController'],
            function(ServerInterface,SettingsController,ChannelGuideController,MainMenuController,ManualRecordController,RecordedShowsController) {

                console.log("all controllers loaded");

                // perform additional initialization tasks
                SettingsController.setServerInterface(ServerInterface);
                ChannelGuideController.setServerInterface(ServerInterface);
                ManualRecordController.setServerInterface(ServerInterface);
                RecordedShowsController.setServerInterface(ServerInterface);

                // maybe put me somewhere else
                // instead of doing the following, just invoke the ServerInterface method to get a promise. then wait for all promises to finish
                SettingsController.retrieveData();
                ChannelGuideController.retrieveData();
                var retrieveScheduledRecordingsPromise = ServerInterface.retrieveScheduledRecordings();
                // wait until all data is retrieved??

                this.settingsModel = SettingsController.getSettingsModel();

                ChannelGuideController.setSettingsModel(this.settingsModel);
            });
    });
});
