function Capture(window, targetWidth, targetHeight) {
  this.targetWidth = targetWidth;
  this.targetHeight = targetHeight;
  this.window = window;
  this.attempts = 0;
  this.getSize();
}

Capture.prototype.capture = function() {
  var tab = this.window.tabs.filter(function(tab) { return tab.active; })[0];
  var filename = tab.title.replace(/[^A-Z0-9]/ig, ' ').replace(/ {2,}/g, ' ') + '.png'

  chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataURL) {
    chrome.downloads.download({
      url: dataURL,
      filename: filename
    });
  });
};

Capture.prototype.checkSize = function(width, height) {
  if ((this.attempts && this.attempts > 2) ||
      (width == this.targetWidth && height == this.targetHeight)) {
    this.capture();
  } else if (this.attempts == 1) {
    this.updateWindow(this.targetWidth, this.targetHeight);
  } else if (this.attempts <= 2) {
    this.updateWindow(this.targetWidth, this.targetHeight);
  }
  this.attempts++;
};

Capture.prototype.getSize = function() {
  var checkSize = this.checkSize.bind(this);
  chrome.tabs.executeScript(null, {
    code: "[window.innerWidth, window.innerHeight]"
  }, function(result) {
    checkSize(result[0][0], result[0][1]);
  });
};

Capture.prototype.updateWindow = function(width, height) {
  var getSize = this.getSize.bind(this);
  chrome.windows.update(this.window.id, {width: width, height: height}, function() {
    setTimeout(getSize, 60);
  });
};

function capture(width, height) {
  if (typeof(width) == 'undefined') {
    width  = 1024;
    height = 768;
  }
  chrome.windows.getCurrent({populate: true}, function(window) {
    new Capture(window, width, height);
  });
}

chrome.browserAction.onClicked.addListener(function() { capture(1025, 768); });

chrome.runtime.onInstalled.addListener(function() {
  addContextFor("iPhone", 357, 667);
  addContextFor("iPad", 768, 1024);
  addContextFor("Desktop", 1024, 768);
  addContextFor("Large Desktop", 1280, 1024);

  chrome.contextMenus.onClicked.addListener(function(menuItem, tab) {
    var parts   = menuItem.menuItemId.split("x");
    var seconds = parseInt(parts[0]);
    var width   = parseInt(parts[1]);
    var height  = parseInt(parts[2]);
    setTimeout(function() { capture(width, height); }, seconds * 1000);
  });
});

var added = false;

function addContextFor(label, width, height) {
  if (added) {
    chrome.contextMenus.create({
      "id":       "separator-" + label,
      "contexts": ["browser_action", "page"],
      "type":     "separator"
    });
  }

  var dimensions = width.toString() + "x" + height.toString();
  var addContext = function(id, caption) {
    chrome.contextMenus.create({
      "id":       id + "x" + dimensions,
      "title":    label + (caption ? " (" + caption + ")" : ""),
      "contexts": ["browser_action", "page"]
    });
  };

  addContext(0, dimensions);
  addContext(1, "1 second delay");
  addContext(2, "2 second delay");
  addContext(5, "3 second delay");
  addContext(10, "10 second delay");
  added = true;
}

