var fm = require('./fm');
var throttle = require('./throttle');
var features = require('./detectFeatures')();

function init () {
// initialize the thing, load data, parse info, etc
}

function setup () {
// setup the thing, insert DOM elements, bind data, etc

	//now that everything is setup, update
	update()
}

function update () {
// update the thing, position, size, and style DOM elemements
	
	// adjust iframe for dynamic content
	fm.resize()
}

function resize() {
// on resize, update save dimensional values and update.
	
	update()
	fm.resize()
}

var throttleRender = throttle(resize, 250);

$(document).ready(function () {
	// adjust iframe for loaded content
	fm.resize()
	$(window).resize(throttleRender);
	init();
	setup();
});
