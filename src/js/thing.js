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

var PLAYBACK_SPEED = 100;
var FIRST_YEAR = 1990;
var LAST_YEAR = 2050;

var indexData = null;
var countryData = {};
var isMobile = false;
var ages = [];
var year = FIRST_YEAR;
var countrySelector = null;
var ageSelector = null;
var selectedCountry = '840';
var selectedAge = 30;
var selectedMax = null;

/**
 * Initialize the graphic.
 *
 * Fetch data, format data, cache HTML references, etc.
 */
function init() {
	for (var i = 0; i <= 100; i++) {
		ages.push(i)
	}

	request.json('data/country_index.json', function(error, data) {
		indexData = data;

		initCountriesList();
		initAgeList();

		loadCountry('156', function(data) {
			loadCountry('356', function(data) {
				loadCountry('900', function(data) {
					loadCountry(selectedCountry, function(data) {
						selectedMax = calculateMax(data);
						
						renderAll();

						$(window).resize(utils.throttle(renderAll, 250));
					});
				})
			});
		});
	});
}

/**
 * Initialize the country picker.
 */
function initCountriesList() {
	countrySelector = d3.select('#countries');

	countrySelector.selectAll("option")
		.data(indexData)
		.enter()
		.append("option")
		.attr("value", function (d) { return d[0]; })
		.attr('selected', function(d) {
			if (d[0] == selectedCountry) {
				return 'selected';
			}

			return null;
		})
		.text(function (d) { return d[1]; });

	countrySelector.on('change', onCountrySelected)
}

/**
 * Initialize the age picker.
 */
function initAgeList() {
	ageSelector = d3.select('#ages');

	ageSelector.selectAll("option")
		.data(ages)
		.enter()
		.append("option")
		.attr("value", function (d) { d; })
		.attr('selected', function(d) {
			if (d == selectedAge) {
				return 'selected';
			}

			return null;
		})
		.text(function (d) { return d; });

	ageSelector.on('change', onAgeSelected)
}

/**
 * User has picked a country.
 */
function onCountrySelected() {
	selectedCountry = d3.select(this).node().value;

	var name = null;

	for (var i in indexData) {
		if (indexData[i][0] == selectedCountry) {
			name = indexData[i][1];
			break;
		}
	}

	loadCountry(selectedCountry, function() {
		var data = countryData[selectedCountry];

		d3.select('#country-name').text(name);

		selectedMax = calculateMax(data);
		console.log(selectedMax);

		render('#country', data[year], selectedMax, true);
	});
}

/**
 * Calculate the max value in this country dataset.
 */
function calculateMax(data) {
	var m = 0;

	for (var year in data) {
		var ages = data[year];

		for (var i in ages) {
			m = Math.max(m, ages[i][0], ages[i][1]);
		}
	}

	return m;
}

/**
 * User has picked an age.
 */
function onAgeSelected() {
	selectedAge = d3.select(this).node().value;

	render('#world', countryData['900'][year], 100000, true);
	render('#country', countryData[selectedCountry][year], selectedMax, true);
}

/**
 * Load the data for a country and invoke the callback with it.
 */
function loadCountry(countryCode, callback) {
	if (countryCode in countryData) {
		callback(countryData[countryCode]);
		return;
	}

	request.json('data/countries/' + countryCode + '.json', function(error, data) {
		countryData[countryCode] = data;

		callback(data);
	});
}

/**
 * Invoke on resize. Rerenders the graphics
 */
function renderAll() {
	var width = $('#interactive-content').width();

	if (width <= MOBILE_BREAKPOINT) {
		isMobile = true;
	} else {
		isMobile = false;
	}

	render('#china', countryData['156'][year], 20000);
	render('#india', countryData['356'][year], 20000);
	render('#world', countryData['900'][year], 100000, true);
	render('#country', countryData[selectedCountry][year], selectedMax, true);
}

/**
 * Figure out the current frame size and render the graphic.
 */
function render(container, data, scaleMax, highlightAge) {
	var width = $(container).width();

	renderGraphic({
		container: container,
		width: width,
		data: data,
		max: scaleMax,
		highlightAge: highlightAge
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
		top: 10,
		right: 30,
		bottom: 50,
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
		.domain([-config['max'], config['max']])
		.range([0, chartWidth]);

	var yScale = d3.scale.ordinal()
		.domain(ages)
		.rangeBands([0, chartWidth]);

	/*
	 * Create D3 axes.
	 */
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient('bottom')
		.ticks(isMobile ? 5 : 7)
		.tickFormat(function(d, i) {
			return Math.abs(d / 1000) + 'm'
		});

	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient('left')
		.tickFormat(function(d, i) {
			var interval = isMobile ? 20 : 10;

			if (i % interval == 0) {
				if (i == 100) {
					return 100 + '+';
				}

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
	var genders = ['male', 'female'];

	for (var gender in genders) {
		var direction = (gender == 0) ? -1 : 1;

		chartElement.append('g')
			.attr('class', 'bars')
			.selectAll('rect')
			.data(ages)
			.enter()
			.append('rect')
				.attr('x', function(d) {
					var x = config['data'][d][gender] * direction;

					if (x >= 0) {
						return xScale(0);
					}

					return xScale(x);
				})
				.attr('width', function(d) {
					var x = config['data'][d][gender] * direction;

					return Math.abs(xScale(0) - xScale(x));
				})
				.attr('y', function(d) {
					return yScale(d);
				})
				.attr('height', yScale.rangeBand())
				.attr('class', function(d) {
					var cls = 'age-' + d + ' gender-' + genders[gender];

					if (config['highlightAge'] && d == selectedAge) {
						cls += ' highlight';
					}

					return cls;
				});
	}
}


// Bind on-load handler
$(document).ready(function() {
	init();
});
