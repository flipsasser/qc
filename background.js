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

chrome.browserAction.onClicked.addListener(function() {
  chrome.windows.getCurrent({populate: true}, function(window) {
    new Capture(window, 1024, 768);
  });
});
