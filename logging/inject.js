function hook(e) {
  if (e.url == "about:blank") {
    // Special case this. There are probably more like this.
    // TODO: put something more robust here
    return;
  }

  var req = parse_url(e.url), ref = parse_url(document.location.href);

  // We're only interested in http (and https)
  if (req.protocol.indexOf("http") == -1) {
    return;
  }

  // We're only really interested in cross-domain requests. This is some sort of
  // poor approximation of same-origin. ish.
  if (req.root == ref.root) {
    return;
  }

  // Log it!
  chrome.extension.sendRequest({'msg': 'log', 'req': req, 'ref': ref});
}

function framesearch(e) {
  if (e.target.tagName == "IFRAME" && e.target.src) {
    hook({'url': e.target.src});
  } else if (e.target.getElementsByTagName) { // Might be a Text node
    var iframes = e.target.getElementsByTagName('iframe');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].src) {
        hook({'url': iframes[i].src});
      }
    }
  }
}

function metainject() {
  var metainject = document.createElement('script');
  metainject.src = chrome.extension.getURL('logging/metainject.js');
  document.head.appendChild(metainject);
}

// Wait a wee bit until document.head exists
// There's a teensy tiny race condition for iframes that are created before
// this callback gets executed (and the metainject gets injected). Let's not
// worry about that, since in practice this callback is called pretty damn fast
setTimeout(metainject, 0);

document.addEventListener('beforeload', hook, true);
document.addEventListener('DOMNodeInsertedIntoDocument', framesearch, true);
