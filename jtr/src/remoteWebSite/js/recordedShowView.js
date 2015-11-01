/**
 * Created by tedshaffer on 10/31/15.
 */
define(function () {

    var recordedShowView = Backbone.View.extend({

        tagName: 'tr',

        template: _.template($('#recordedShowTemplate').html()),

        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        }

    });

    return recordedShowView;

});
