// NPM modules
var d3 = require('d3');
var request = require('d3-request');

// Local modules
var features = require('./detectFeatures')();
var fm = require('./fm');
var utils = require('./utils');

// Globals
var DEFAULT_WIDTH = 940;
var MOBILE_BREAKPOINT = 600;
var COUNTRY_CODE = '156';	// China
var YEAR = '2015';

var graphicData = null;
var isMobile = false;
var ages = [];

/**
 * Initialize the graphic.
 *
 * Fetch data, format data, cache HTML references, etc.
 */
function init() {
	for (var i = 0; i <= 100; i++) {
		ages.push(i)
	}

	request.json('data/countries/' + COUNTRY_CODE + '.json', function(error, data) {
		graphicData = data;

		render();
		$(window).resize(utils.throttle(onResize, 250));
	});
}

/**
 * Invoke on resize. By default simply rerenders the graphic.
 */
function onResize() {
	render();
}

/**
 * Figure out the current frame size and render the graphic.
 */
function render() {
	var width = $('#interactive-content').width();

	if (width <= MOBILE_BREAKPOINT) {
		isMobile = true;
	} else {
		isMobile = false;
	}

	renderGraphic({
		container: '#graphic',
		width: width,
		data: graphicData[YEAR]
	});

	// Inform parent frame of new height
	fm.resize()
}

/*
 * Render the graphic.
 */
function renderGraphic(config) {
	// Configuration
	var aspectRatio = 1;

	var margins = {
		top: 0,
		right: 30,
		bottom: 30,
		left: 50
	};

	// Calculate actual chart dimensions
	var width = config['width'];
	var height = width / aspectRatio;

	var chartWidth = width - (margins['left'] + margins['right']);
	var chartHeight = height - (margins['top'] + margins['bottom']);

	// Clear existing graphic (for redraw)
	var containerElement = d3.select(config['container']);
	containerElement.html('');

	// Create the root SVG element
	var chartWrapper = containerElement.append('div')
		.attr('class', 'graphic-wrapper');

	var chartElement = chartWrapper.append('svg')
		.attr('width', chartWidth + margins['left'] + margins['right'])
		.attr('height', chartHeight + margins['top'] + margins['bottom'])
		.append('g')
		.attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

	/*
	 * Create D3 scales
	 */
	var xScale = d3.scale.linear()
		.domain([0, 20000])
		.range([0, chartWidth]);

	var yScale = d3.scale.ordinal()
		.domain(ages)
		.rangeRoundBands([0, chartWidth], .1);

	/*
	 * Create D3 axes.
	 */
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient('bottom');

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient('left')
		.tickFormat(function(d, i) {
			if (i % 5 == 0) {
				return d;
			}

			return null;
		});

	/*
	 * Render axes to chart.
	 */
	chartElement.append('g')
		.attr('class', 'x axis')
		.attr('transform', utils.makeTranslate(0, chartHeight))
		.call(xAxis);


	chartElement.append('g')
	   .attr('class', 'y axis')
	//    .attr('transform', utils.makeTranslate(0, chartHeight))
	   .call(yAxis);

	/*
	 * Render grid to chart.
	 */
	var xAxisGrid = function() {
		return xAxis;
	};

	chartElement.append('g')
		.attr('class', 'x grid')
		.attr('transform', utils.makeTranslate(0, chartHeight))
		.call(xAxisGrid()
			.tickSize(-chartHeight, 0, 0)
			.tickFormat('')
		);

	/*
	 * Render bars to chart.
	 */
	chartElement.append('g')
		.attr('class', 'bars')
		.selectAll('rect')
		.data(ages)
		.enter()
		.append('rect')
			.attr('x', function(d) {
				var x = config['data'][d][0];

				if (x >= 0) {
					return xScale(0);
				}

				return xScale(x);
			})
			.attr('width', function(d) {
				return Math.abs(xScale(0) - xScale(config['data'][d][0]));
			})
			.attr('y', function(d) {
				return yScale(d);
			})
			.attr('height', yScale.rangeBand())
			.attr('class', function(d, i) {
				return 'age-' + d;
			});
}

// Bind on-load handler
$(document).ready(function() {
	init();
});
