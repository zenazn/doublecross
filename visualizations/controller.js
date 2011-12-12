// Easy attribute getter, with optional function wrapper
var $a = function(attr, f) {
  return function(d) {
    return (typeof f == 'function') ? f(d[attr]) : d[attr];
  }
}

// We really ought to use some sort of load event here, but there's some weird
// bug (?) in Chrome that makes the div be 0x0 when this code gets called the
// first time (refreshes work just fine). Since everything is served off of
// disk anyways, this kludge will probably work just fine
setTimeout(function() {
  var div = document.getElementById('content');
  // TODO: This isn't robust to page refreshes
  var w = div.offsetWidth, h = div.offsetHeight;
  var minsize = Math.min(w, h);

  // Top-level SVG
  var v = d3.select('#content').append('svg');

  var fill = d3.scale.category20();
  var bubble = d3.layout.pack()
    .sort(null)
    .size([w, h])
    .value(function(d) { return d.num; });

  var burst_scale = 0.9 * minsize / 2.0 / 3.0;
  var sunburst = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, burst_scale])
    .value($a('num'))
  var arc = d3.svg.arc()
    .startAngle($a('x'))
    .endAngle(function(d) { return d.x + d.dx; })
    // We want to cut off the innermost ring. We assume all the rings have
    // equal width
    .innerRadius(function(d) { return (d.y - d.dy) * burst_scale / (burst_scale - d.dy) + minsize / 4.0; })
    .outerRadius(function(d) { return d.y * burst_scale / (burst_scale - d.dy) + minsize / 4.0; });


  // Render a bubble layout of all the trackers
  var render_trackers = function(trackers) {
    var node = v.selectAll('g.node')
      .data(bubble.nodes({'children': trackers})
        .filter(function(d) { return !d.children; }))
      .enter().append('g')
        .attr('class', 'node')
        .on('click', function(targ) {
          // Center and zoom on the clicked node
          // s is the scaling factor to get the focused node uniformly sized
          var s = minsize / (4.0 * targ.r);
          v.selectAll('path.pie').remove();
          v.selectAll('g.node').transition()
            .duration(500)
            .attr('transform', function(d) {
              var x = (d.x - targ.x) * s + w / 2.0,
                  y = (d.y - targ.y) * s + h / 2.0;
              return 'translate(' + x + ', ' + y + ') scale(' + s + ', ' + s + ')';
            });

          // Fetch data for the pie chart
          setTimeout(db_get_by_tracker.bind(null, targ.req_root, render_tracker.bind(null, targ.req_root)), 600);

          // Nom the event so our other mouse handlers don't fire
          d3.event.stopPropagation();
        })
        .attr('transform', function(d) {
          return 'translate(' + d.x + ', ' + d.y + ') scale(1, 1)';
        });

    node.append('title')
      .text(function(d) { return d.req_root + ': ' + d.num; });

    node.append('circle')
      .attr('r', $a('r'))
      .attr('fill', $a('req_root', fill));

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', function(d) {
        // Font size is proportional to node size
        return (d.r / 5) + "px";
      })
      .text($a('req_root'));
  };

  // Render a sunburst chart of per-tracker sites around a central node
  var render_tracker = function(tracker, rows) {
    var fill = d3.scale.category20();

    var tree = {children: rows};

    var path = v.selectAll('path.pie')
      .data(sunburst.nodes(tree))
      .enter().append('path')
      .attr('class', 'pie')
      .attr('d', arc)
      .attr('transform', 'translate(' + (w / 2.0) + ', ' + (h / 2.0) + ')')
      .style('visibility', function(d) {
        // Get rid of the central node
        return d.depth == 0 ? 'hidden' : null;
      })
      .style('stroke', '#fff')
      .style('fill', $a('ref_root', fill))
      .on('click', function(d) {
        // TODO: pretty things here
        console.log(tracker + ", " + d.ref_root);
        d3.event.stopPropagation();
      });

    path.append('title')
      .text(function(d) { return d.ref_root + ': ' + d.num; });
  };

  var render_site = function(site, tracker, rows) {
    // TODO: this
  };

  document.getElementById('content').addEventListener('click', function(e) {
    v.selectAll('path.pie').remove();
    v.selectAll('g.node').transition()
      .attr('transform', function(d) {
        return 'translate(' + d.x + ', ' + d.y + ') scale(1, 1)';
      });
  });

  // Start things off
  db_get_trackers(render_trackers);
}, 10);
