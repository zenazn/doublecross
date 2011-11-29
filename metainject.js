// The inject-inject script. Runs in the page in the page's context.

!function() { // Leave no trace.
  function tweak_iframe(frame) {
    // Funnel calls to .src through getAttribute and setAttribute explicitly
    // This preserves the API callers expect, but allows us to poison the
    // iframe setAttribute
    frame.__defineSetter__('src', function(src) {
      frame.setAttribute('src', src);
    });
    frame.__defineGetter__('src', function() {
      return frame.getAttribute('src');
    });
  }

  function trap_iframe(e) {
    if (e.target.tagName == "IFRAME") {
      tweak_iframe(e.target);
    } else if (e.target.getElementsByTagName) {
      var iframes = e.target.getElementsByTagName('iframe');
      for (var i = 0; i < iframes.length; i++) {
        tweak_iframe(iframes[i]);
      }
    }
  }

  var old = HTMLIFrameElement.prototype.setAttribute;
  HTMLIFrameElement.prototype.setAttribute = function(attr, val) {
    old.call(this, attr, val);
    if (attr == 'src' && this.parentNode) {
      // Toggle this iframe in and out of the DOM so our event handler will catch
      // it. Hopefully this doesn't break anything!
      // TODO: Find a better way of communicating back to the mothership
      var parent = this.parentElement;
      var next = this.nextSibling;
      parent.removeChild(this);
      parent.insertBefore(this, next);
    }
  }

  document.addEventListener('DOMNodeInsertedIntoDocument', trap_iframe, true);
}();
