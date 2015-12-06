/**
 * Created by tedshaffer on 10/31/15.
 */
define(['serverInterface','recordedShowModel'], function (serverInterface, RecordedShowModel) {

    console.log("creating RecordedShowsModel module");

    var RecordedShowsModel = Backbone.Collection.extend({

        urlRoot : '/recordedShows',
        url : '/recordedShows',
        model: RecordedShowModel,

        sync: function(method, model, options) {
            options = options || {};
            options.url = serverInterface.getBaseUrl() + "recordedShows";
            Backbone.sync(method, model, options);
        }
    });

    return RecordedShowsModel;
});
