/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    var recordedShowsModel = Backbone.Collection.extend({

        urlRoot : '/recordedShows',

    });
    return recordedShowsModel;
});
