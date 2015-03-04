/**
 * The AnalysisView selector view.
 *
 * @return AnalysisView instance (extends Backbone.View).
 */
define([
  'underscore',
  'handlebars',
  'amplify',
  'chosen',
  'map/presenters/tabs/AnalysisPresenter',
  'text!map/templates/tabs/analysis.handlebars'
], function(_, Handlebars, amplify, chosen, Presenter, tpl) {

  'use strict';

  var AnalysisModel = Backbone.Model.extend({
    hidden: true
  });


  var AnalysisView = Backbone.View.extend({

    el: '#analysis-tab',

    template: Handlebars.compile(tpl),

    events: {
      //tabs
      'click #analysis-nav li' : 'toggleTabs',

      //draw
      'click #start-analysis' : '_onClickAnalysis',
      'click #done-analysis' : '_onClickDone',

      //countries
      'change #analysis-country-select' : 'changeIso',
      'change #analysis-region-select' : 'changeArea',
      'click #analysis-country-button' : 'analysisCountry',

      //other
      'click #data-tab-play' : 'onGifPlay'
    },

    initialize: function(map) {
      _.bindAll(this, '_onOverlayComplete', '_cartodbLayerDone');
      this.map = map;
      this.presenter = new Presenter(this);
      this.model = new AnalysisModel();
      this.render();
      this.setListeners();
    },

    cacheVars: function(){
      this.$button = $('#'+this.$el.attr('id')+'-button');
      //draw
      this.$start = $('#start-analysis');
      this.$done = $('#done-analysis');

      //country
      this.$selects = $('.chosen-select');
      this.$countrySelect = $('#analysis-country-select');
      this.$regionSelect = $('#analysis-region-select');

      //other
      this.$img = $('#data-tab-img');
      this.$play = $('#data-tab-play');

      //tabs
      this.$tabs = $('#analysis-nav li');
      this.$tabsContent = $('.analysis-tab-content');

      //delete
      this.timeout = null;

    },

    setListeners: function(){

    },

    render: function(){
      this.$el.html(this.template());
      this.cacheVars();
      this.inits();
    },

    inits: function(){
      // countries
      this.setStyle(0.45);
      this.getCountries();

      //other
      this.png = '/assets/infowindow-example.png';
      this.gif = this.loadImg('/assets/infowindow-example.gif');
    },

    // navigate between tabs
    toggleTabs: function(e){

      if (!$(e.currentTarget).hasClass('disabled')) {
        var tab = $(e.currentTarget).data('analysis');

        // Current tab
        this.$tabs.removeClass('active');
        $(e.currentTarget).addClass('active');

        // Current content tab
        this.$tabsContent.removeClass('active');
        $('#'+tab).addClass('active');

        // prevent changes between tabs without reset drawing
        if (this.model.get('is_drawing')) {
          this._stopDrawing();
          this.presenter.deleteAnalysis();
        }
      }else{
        this.$deletebtn = $('#analysis-delete');
        clearTimeout(this.timeout);
        this.$deletebtn.addClass('pulse');
        this.timeout = setTimeout(_.bind(function(){
          this.$deletebtn.removeClass('pulse');
        }, this ),3000)
      }
    },

    openTab: function(type){
      var current;
      switch(type){
        case 'geojson':
          current = '#draw-tab-button';
          $('#draw-tab-button').removeClass('disabled').trigger('click');
        break;
        case 'iso':
          current = '#country-tab-button';
          $('#country-tab-button').removeClass('disabled').trigger('click');
        break;
        case 'other':
          current = '#data-tab-button';
          $('#data-tab-button').removeClass('disabled').trigger('click');
        break;
      }
      this.fixTab(current);
    },

    fixTab: function(current){
      // function to fix current tab and prevent user for changing tab with an analysis rendered
      this.$tabs.addClass('disabled');
      $(current).removeClass('disabled');
    },


    /**
     * Set geojson style.
     */
    setStyle: function(opacity) {
      this.style = {
        strokeWeight: 2,
        fillOpacity: opacity,
        fillColor: '#FFF',
        strokeColor: '#A2BC28',
        icon: new google.maps.MarkerImage(
          '/assets/icons/marker_exclamation.png',
          new google.maps.Size(36, 36), // size
          new google.maps.Point(0, 0), // offset
          new google.maps.Point(18, 18) // anchor
        )
      };

      this.map.data.setStyle(this.style);
    },






    /**
     * COUNTRY
     */

    /**
     * Ajax for getting countries.
     */
    getCountries: function(){
      if (!amplify.store('countries')) {
        var sql = ['SELECT c.iso, c.name FROM gfw2_countries c WHERE c.enabled = true'];
        $.ajax({
          url: 'https://wri-01.cartodb.com/api/v2/sql?q='+sql,
          dataType: 'json',
          success: _.bind(function(data){
            amplify.store('countries', data.rows);
            this.printCountries();
          }, this ),
          error: function(error){
            console.log(error);
          }
        });
      }else{
        this.printCountries()
      }
    },

    getSubCountries: function(){
      this.$regionSelect.attr('disabled', true).trigger("liszt:updated");
      var sql = ["SELECT gadm_1_all.cartodb_id, gadm_1_all.iso, gadm2_provinces_simple.id_1, gadm2_provinces_simple.name_1 as name_1 FROM gadm_1_all, gadm2_provinces_simple where gadm_1_all.iso = '"+this.iso+"' AND gadm2_provinces_simple.iso = '"+this.iso+"' AND gadm2_provinces_simple.id_1 = gadm_1_all.id_1 order by id_1 asc"];
      $.ajax({
        url: 'https://wri-01.cartodb.com/api/v2/sql?q='+sql,
        dataType: 'json',
        success: _.bind(function(data){
          this.printSubareas(data.rows);
        }, this ),
        error: function(error){
          console.log(error);
        }
      });
    },

    /**
     * Print countries.
     */
    printCountries: function(){
      //Country select
      this.countries = amplify.store('countries');

      //Loop for print options
      var options = "<option></option>";
      _.each(_.sortBy(this.countries, function(country){ return country.name }), _.bind(function(country, i){
        options += '<option value="'+ country.iso +'">'+ country.name + '</option>';
      }, this ));
      this.$countrySelect.append(options);
      this.$selects.chosen({
        width: '100%',
        allow_single_deselect: true,
        inherit_select_classes: true,
        no_results_text: "Oops, nothing found!"
      });
    },

    printSubareas: function(subareas){
      var subareas = subareas;
      var options = "<option></option>";
      _.each(_.sortBy(subareas, function(area){ return area.name_1 }), _.bind(function(area, i){
        options += '<option value="'+ area.id_1 +'">'+ area.name_1 + '</option>';
      }, this ));
      this.$regionSelect.empty().append(options).removeAttr('disabled');
      this.$regionSelect.val(this.area).trigger("liszt:updated");
    },

    // Select change iso
    changeIso: function(e){
      this.iso = $(e.currentTarget).val();
      this.area = null;
      ($(e.currentTarget).val()) ? this.getSubCountries() : this.$regionSelect.val(null).attr('disabled', true).trigger("liszt:updated");
    },
    changeArea: function(e){
      this.area = $(e.currentTarget).val();
    },

    // For autoselect country and region when youn reload page
    setSelects: function(iso){
      this.iso = iso.country;
      this.area = iso.region;

      this.$countrySelect.val(this.iso).trigger("liszt:updated");
      if (this.iso) {
        this.getSubCountries();
      }
    },

    analysisCountry: function(){
      if (this.iso) {
        var iso = {
          country: this.iso,
          region: this.area
        }
        this.presenter._analyzeIso(iso);
      }
    },









    /**
     * DRAWING
     */
    /**
     * Triggered when the user clicks on the analysis draw button.
     */
    _onClickAnalysis: function() {
      if (!this.$start.hasClass('in_use')) {
        ga('send', 'event', 'Map', 'Analysis', 'Click: start');
        this.toggleUseBtn(true);
        this._startDrawingManager();
        this.presenter.startDrawing();
      }else{
        ga('send', 'event', 'Map', 'Analysis', 'Click: cancel');
        this._stopDrawing();
        this.presenter.deleteAnalysis();
      }
    },

    /**
     * Triggered when the user clicks on done
     * to get the analysis of the new polygon.
     */
    _onClickDone: function() {
      if (!this.$done.hasClass('disabled')) {
        ga('send', 'event', 'Map', 'Analysis', 'Click: done');
        this._stopDrawing();
        this.presenter.doneDrawing();
      }
    },

    /**
     * Star drawing manager and add an overlaycomplete
     * listener.
     */
    _startDrawingManager: function() {
      this.setStyle(0.45);
      this.model.set('is_drawing', true);
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        polygonOptions: _.extend({
          editable: true
        }, this.style),
        panControl: false,
        map: this.map
      });
      // cache cartodb infowindows
      this.$infowindows = $('.cartodb-infowindow');
      this.$infowindows.addClass('hidden');


      google.maps.event.addListener(this.drawingManager,
        'overlaycomplete', this._onOverlayComplete);
    },

    /**
     * Triggered when the user finished drawing a polygon.
     *
     * @param  {Object} e event
     */
    _onOverlayComplete: function(e) {
      ga('send', 'event', 'Map', 'Analysis', 'Polygon: complete');
      this.presenter.onOverlayComplete(e);
      this._resetDrawing();
      // buttons clases
      this.toggleDoneBtn(false);
    },

    /**
     * Stop drawing manager, set drawing box to hidden.
     */
    _stopDrawing: function() {
      this.presenter.stopDrawing();
      this._resetDrawing();
      // buttons clases
      this.toggleUseBtn(false);
      this.toggleDoneBtn(true);
    },

    _resetDrawing: function(){
      this.model.set('is_drawing', false);
      if(this.$infowindows)
        this.$infowindows.hide(0).removeClass('hidden');
      if (this.drawingManager) {
        this.drawingManager.setDrawingMode(null);
        this.drawingManager.setMap(null);
      }
    },

    /**
     * Deletes a overlay from the map.
     *
     * @param  {object} resource overlay/multipolygon
     */
    deleteGeom: function(resource) {
      if (resource.overlay) {
        resource.overlay.setMap(null);
        resource.overlay = null;
      }

      if (resource.multipolygon) {
        this.map.data.remove(resource.multipolygon);
        this._removeCartodblayer();
      }


      this.$tabs.removeClass('disabled');
    },

    setEditable: function(overlay, to) {
      overlay.setEditable(to);
    },

    /**
     * Draw Geojson polygon on the map.
     *
     * @param  {String} geojson Geojson polygon as a string
     */
    drawPaths: function(paths) {
      var overlay = new google.maps.Polygon(
        _.extend({}, {paths: paths}, this.style));

      overlay.setMap(this.map);
      this.presenter.setOverlay(overlay);
    },

    /**
     * Draw a multypoligon on the map.
     *
     * @param  {Object} topojson
     */
    drawMultipolygon: function(geojson) {
      var multipolygon = this.map.data.addGeoJson(geojson)[0];
      this.presenter.setMultipolygon(multipolygon, geojson);
    },





    // COUNTRY MASK
    drawMaskCountry: function(geojson, iso){
      this.setStyle(0);
      this._removeCartodblayer();

      this.mask = cartodb.createLayer(this.map, {
        user_name: 'wri-01',
        type: 'cartodb',
        cartodb_logo: false,
        sublayers: [{
          name: 'mask',
          sql: "SELECT * FROM country_mask",
          cartocss: "\
            #country_mask {\
              polygon-fill: #373737;\
              polygon-opacity: 0.5;\
              line-color: #333;\
              line-width: 0;\
              line-opacity: 0;\
            }\
            #country_mask[code='" + iso + "'] {\
              polygon-opacity: 0;\
              line-color: #97Bd3d;\
              line-width: 1;\
              line-opacity: 0;\
            }"
        }]
      });
      this.mask.addTo(this.map, 1000)
      this.mask.done(this._cartodbLayerDone);

      var multipolygon = this.map.data.addGeoJson(geojson)[0];
      this.presenter.setMultipolygon(multipolygon, geojson);

    },

    // COUNTRY MASK
    drawMaskArea: function(geojson, iso, region){
      this.setStyle(0);
      this._removeCartodblayer();

      this.mask = cartodb.createLayer(this.map, {
        user_name: 'wri-01',
        type: 'cartodb',
        cartodb_logo: false,
        sublayers: [{
          sql: "SELECT * FROM country_mask",
          cartocss: "\
            #country_mask {\
              polygon-fill: #373737;\
              polygon-opacity: 0.5;\
              line-color: #333;\
              line-width: 0;\
              line-opacity: 0;\
            }\
            #country_mask[code='" + iso + "'] {\
              polygon-opacity: 0;\
              line-color: #333;\
              line-width: 1;\
              line-opacity: 1;\
            }"
        }, {
          sql: "SELECT * FROM gadm_1_all WHERE iso LIKE '" + iso +"' ",
          cartocss: "\
            #gadm_1_all {\
              polygon-fill: #373737;\
              polygon-opacity: 0.5;\
              line-color: #333;\
              line-width: 0;\
              line-opacity: 0;\
              [id_1=" + region + "]{\
                polygon-opacity: 0;\
              }\
              ::active[id_1=" + region + "] {\
                polygon-opacity: 0;\
                line-color: #73707D;\
                line-width: 1;\
                line-opacity: 1;\
              }\
            }"
        }]
      })
      this.mask.addTo(this.map, 1000)
      this.mask.done(this._cartodbLayerDone);

      var multipolygon = this.map.data.addGeoJson(geojson)[0];
      this.presenter.setMultipolygon(multipolygon, geojson);

    },


    _removeCartodblayer: function() {
      if (this.cartodbLayer) {
        this.cartodbLayer.remove();
      }
    },

    _cartodbLayerDone: function(layer) {
      this.cartodbLayer = layer;
    },












    /**
     * BUTTONS.
     */
    toggleBtn: function(to) {
      if (to) {
        (this.$button.hasClass('active')) ? this.$button.trigger('click') : null;
        this.$button.removeClass('in_use').addClass('disabled');
      }else{
        this.$button.removeClass('disabled');
      }
      $('.cartodb-popup').toggleClass('dont_analyze', to);
    },

    toggleUseBtn: function(to){
      this.$start.toggleClass('in_use', to);
      (to) ? this.$start.removeClass('green').addClass('gray').text('Cancel') : this.$start.removeClass('gray').addClass('green').text('Start drawing');
      $('.cartodb-popup').toggleClass('dont_analyze', to);
    },

    toggleDoneBtn: function(to){
      $('#draw-analysis').toggleClass('one', to);
      this.$done.parent().toggleClass('hidden', to);
    },



    // OTHER
    onGifPlay: function(){
      this.$play.addClass('hidden');
      this.$img.attr('src',this.gif);
      setTimeout(_.bind(function(){
        this.$play.removeClass('hidden');
        this.$img.attr('src',this.png);
      }, this ), 10000 );
    },

    loadImg: function(url){
      var img = new Image();
      img.src = url;
      return url;
    },






  });
  return AnalysisView;

});