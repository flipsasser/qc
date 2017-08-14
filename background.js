chrome.browserAction.onClicked.addListener(function() {
  chrome.windows.getCurrent({populate: true}, function(window) {
    let tab = window.tabs.filter(function(tab) { return tab.active })[0]
    let filename = tab.title.replace(/[^A-Z0-9]/ig, ' ').replace(/ {2,}/g, ' ') + '.png'

    chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataURL) {
      let img = document.createElement('img')
      img.src = dataURL

      let container = document.createElement('div')
      container.contentEditable = true
      container.appendChild(img)
      document.body.appendChild(container)

      let selection = document.getSelection()
      let range = document.createRange()
      range.selectNodeContents(container)
      selection.removeAllRanges()
      selection.addRange(range)

      document.execCommand('copy')
    })
  })
})

