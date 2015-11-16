/**
 * Created by tedshaffer on 10/31/15.
 */
define(['serverInterface','recordedShowModel'], function (ServerInterface, RecordedShowModel) {

    console.log("creating recordedShowsModel module");

    var recordedShowsModel = Backbone.Collection.extend({

        ServerInterface: ServerInterface,

        urlRoot : '/recordedShows',
        url : '/recordedShows',
        model: RecordedShowModel,

        //set: function(models, options) {
        //    console.log("recordedShowsModel.set invoked");
        //},

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/recordedShows";
            //options.url = "http://192.168.2.8:8080/recordedShows";
            options.url = this.ServerInterface.getBaseUrl() + "recordedShows";
            Backbone.sync(method, model, options);
        }
    });

    return recordedShowsModel;
});
