/**
 * Created by tedshaffer on 10/31/15.
 */
define(['recordedShowModel'], function (RecordedShowModel) {

    var recordedShowsModel = Backbone.Collection.extend({

        urlRoot : '/recordedShows',
        url : '/recordedShows',
        model: RecordedShowModel,

        //set: function(models, options) {
        //    console.log("recordedShowsModel.set invoked");
        //},
    });

    return recordedShowsModel;
});
