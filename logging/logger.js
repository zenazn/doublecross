function log(msg, cb) {
  // We actually do a bit more filtering on this end. We only want requests
  // which have cookies attached (CDN URLs don't count, for instance), and we
  // don't have access to the cookie API from the injected script
  chrome.cookies.getAll({url: msg.req.href}, function(cookies) {
    if (cookies && cookies.length > 0) {
      // We're sending cookies. Potential spying. Rut roh!
      // Turns out you can get a lot of data from a request even if explicit
      // tracking cookies aren't involved. However, since that's considerably
      // more complex (from the service provider's point of view) and since
      // doing the traditional tracker cookie thing is so easy, we'll assume
      // that's what everyone is doing. This is probably Mostly Correct (tm)
      db_insert_request(msg.req, msg.ref);
    }
  });
}

var handlers = {
  'log': log
};

chrome.extension.onRequest.addListener(function(req, sender, cb) {
  // Simple dispatch. It's super effective!
  handlers[req.msg](req, cb);
});

