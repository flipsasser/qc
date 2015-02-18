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
  this.attempts++;
  if (width == this.targetWidth && height == this.targetHeight) {
    this.capture();
  } else if (this.attempts == 1) {
    this.updateWindow(this.targetWidth, this.targetHeight);
  } else if (this.attempts <= 2) {
    var offsetWidth = this.targetWidth - width;
    var offsetHeight = this.targetHeight - height;
    this.updateWindow(this.targetWidth + offsetWidth, this.targetHeight + offsetHeight);
  }
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

function capture() {
  chrome.windows.getCurrent({populate: true}, function(window) {
    new Capture(window, 1024, 768);
  });
}

function addContextFor(seconds) {
  chrome.contextMenus.create({
    "id":       seconds.toString(),
    "title":    seconds + " second delayed capture",
    "contexts": ["browser_action", "page"]
  });
}

chrome.browserAction.onClicked.addListener(capture)

chrome.runtime.onInstalled.addListener(function() {
  addContextFor(1);
  addContextFor(2);
  addContextFor(5);
  addContextFor(10);
  chrome.contextMenus.onClicked.addListener(function(menuItem, tab) {
    var seconds = parseInt(menuItem.menuItemId);
    console.log(seconds);
    setTimeout(capture, seconds * 1000);
  });
});
