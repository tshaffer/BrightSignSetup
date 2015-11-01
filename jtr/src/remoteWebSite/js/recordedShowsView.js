/**
 * Created by tedshaffer on 10/31/15.
 */
define(['recordedShowView'], function (RecordedShowView) {

    var recordedShowsView = Backbone.View.extend({

        el: '#recordedShowsPage',

        initialize: function () {
        },

        show: function() {
            this.render();
        },

        render: function() {
            this.$el.html('');

            var self = this;
            this.model.each(function(recordedShowModel) {
                console.log(recordedShowModel);
                var recordedShowView = new RecordedShowView( {
                    model: recordedShowModel
                });
                //self.$el.append(recordedShowView.render().el);
            });

            //Surfboards.each(function(model) {
            //    var surfboard = new SurfboardView({
            //        model: model
            //    });
            //
            //    this.$el.append(surfboard.render().el);
            //}.bind(this));


            return this;
        }


    });

    return recordedShowsView;
});
