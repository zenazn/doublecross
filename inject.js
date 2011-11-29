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

document.addEventListener('beforeload', hook, true);
