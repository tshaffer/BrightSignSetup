/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    var recordedShowsView = Backbone.View.extend({

        el: '#recordedShowsPage',

        initialize: function () {
        },

        render: function() {
            this.$el.html('');

            return this;
        }

    });

    return recordedShowsView;
});
