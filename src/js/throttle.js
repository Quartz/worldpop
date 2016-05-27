// throttle a function call
module.exports = function (fn, threshold, scope) {
	threshold || (threshold = 250);
	var last,
			deferTimer;
	return function () {
		var context = scope || this;

		var now = +new Date(),
				args = arguments;
		if (last && now < last + threshold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
};
