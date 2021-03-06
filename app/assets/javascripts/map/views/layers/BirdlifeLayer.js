/**
 * The Birdlife layer module for use on canvas.
 *
 * @return BirdlifeLayer class (extends CanvasLayerClass)
 */
define([
  'abstract/layer/CartoDBLayerClass',
], function(CartoDBLayerClass) {

  'use strict';

  var BirdlifeLayer = CartoDBLayerClass.extend({

    options: {
      sql: 'SELECT the_geom_webmercator, ebaaltmin::text, ebaaltmax, ebabookcod as id, ebaname, factsheet, \'{tableName}\' AS layer FROM {tableName}',
      infowindow: true,
      interactivity: 'ebaname, id, ebaaltmin, ebaaltmax, factsheet'
    }

  });

  return BirdlifeLayer;

});
