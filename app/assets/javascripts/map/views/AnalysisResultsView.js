/**
 * The Analysis view.
 *
 * @return Analysis view (extends Widget.View)
 */
define([
  'underscore',
  'handlebars',
  'views/Widget',
  'presenters/AnalysisResultsPresenter',
  'text!templates/analysisResults.handlebars'
], function(_, Handlebars, Widget, Presenter, tpl) {

  'use strict';

  var AnalysisResultsView = Widget.extend({

    className: 'widget widget-analysis-results',

    template: Handlebars.compile(tpl),

    options: {
      hidden: true,
      boxHidden: true,
      boxClosed: false
    },

    events: function(){
      return _.extend({}, AnalysisResultsView.__super__.events, {
        'click .delete': '_deleteAnalysis'
      });
    },

    initialize: function() {
      this.presenter = new Presenter(this);
      AnalysisResultsView.__super__.initialize.apply(this);
    },

    _cacheSelector: function() {
      AnalysisResultsView.__super__._cacheSelector.apply(this);
    },

    renderAnalysis: function(results) {
      var params = [];

      params.ha = this._calcAreaPolygon(results.params.geojson);
      params.timescale = results.meta.timescale;
      params.alertsCount = results.value || 0;
      params.downloadUrls = results.download_urls;

      this._update(this.template(params));
      this.model.set('hidden', false);
    },

    _deleteAnalysis: function(e) {
      this.presenter.deleteAnalysis();
      this.model.set('hidden', true);
    },

    _calcAreaPolygon: function(polygon) {
      // https://github.com/maxogden/geojson-js-utils
      var area = 0;
      var points = polygon.coordinates;

      var j = points.length - 1;
      var p1, p2;

      for (var i = 0; i < points.length; j = i++) {
        var p1 = {
          x: points[i][1],
          y: points[i][0]
        };
        var p2 = {
          x: points[j][1],
          y: points[j][0]
        };
        area += p1.x * p2.y;
        area -= p1.y * p2.x;
      }

      area /= 2;
      area = Math.abs(area);

      return (Math.ceil((area*1000000) * 10) / 10).toLocaleString();
    }
  });

  return AnalysisResultsView;

});
