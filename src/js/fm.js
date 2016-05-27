// @if GULP_ENV='prod'
var urlHostCheck = /[A-za-z0-9_]+\.[A-za-z0-9_]+$/;
var hostName = window.location.hostname.match(urlHostCheck)[0];

var FM = FM || frameMessager({
  allowFullWindow : false,
  parentDomain : hostName,
  requestHeight : {
    desktop : 629,
    tablet : 629,
    mobile : 449
  }
});

FM.onMessage("app:activePost", function () { resize(); });
// @endif

var $interactive = $('#interactive-content');

function documentHeight () {
  var body = document.body;
  var html = document.documentElement;
  var height =  Math.max( body.scrollHeight, body.offsetHeight,
             html.clientHeight, html.scrollHeight, html.offsetHeight );

  return height;
}

function updateHeight (height) {
  // Add frameMessager call in production build
  // default height check if nothing is given to func

  // @if GULP_ENV='prod'
  height = height || documentHeight();

  FM.triggerMessage('QZParent', 'child:updateHeight', {
    height : height
  });
  // @endif

  // This function will do nothing in development build

  // @if GULP_ENV='dev'
  return;
  // @endif
}

function resize () {
  // resize and call frameMessager
  var height = $interactive.height();
  updateHeight(height);
}

module.exports = {
  resize: resize
};
