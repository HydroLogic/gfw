/**
 * The Mining layer module.
 *
 * @return MiningLayer class (extends CartoDBLayerClass)
 */
define([
  'abstract/layer/CartoDBLayerClass',
], function(CartoDBLayerClass) {

  'use strict';

  var MiningLayer = CartoDBLayerClass.extend({

    options: {
      sql: 'SELECT cartodb_id, \'mining\' as tablename, the_geom_webmercator, status,company, country, area_ha, name, \'{tableName}\' AS layer, {analysis} AS analysis FROM {tableName} ',
      infowindow: true,
      interactivity: 'cartodb_id, tablename, name, status,company, country, area_ha, analysis',
      analysis: true
    }


  });

  return MiningLayer;

});
