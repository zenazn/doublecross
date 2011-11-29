// This probably isn't particularly rigorous. We're trying to go from
// google.com -> google.com
// news.google.com -> google.com
var root_re = /((?:[^.]+\.)?[^.]+)$/;

function parse_url(url) {
  // This is a hack. I don't want to parse the URL, so make a fake <a> instead
  var a = document.createElement('a');
  a.href = url;
  return {
    "href": a.href,
    "host": a.host,
    "root": root_re.exec(a.host)[1],
    "protocol": a.protocol
  };
}
