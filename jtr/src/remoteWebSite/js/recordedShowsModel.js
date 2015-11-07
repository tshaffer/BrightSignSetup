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

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/recordedShows";
            options.url = "http://192.168.2.8:8080/recordedShows";
            Backbone.sync(method, model, options);
        }
    });

    return recordedShowsModel;
});
