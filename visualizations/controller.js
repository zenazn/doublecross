var fill = d3.scale.category20();
var v;

// Easy attribute getter
var $a = function(attr, f) {
  if (typeof f == 'function') {
    return function(d) { return f(d[attr]); };
  } else {
    return function(d) { return d[attr]; };
  }
}

window.addEventListener('load', function() {
  var div = document.getElementById('content');
  var minsize = Math.min(div.offsetHeight, div.offsetWidth);
  var bubble = d3.layout.pack()
    .sort(null)
    .size([div.offsetWidth, div.offsetHeight])
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
  v = d3.select('#content').append('svg')
    .attr('width', div.offsetWidth)
    .attr('height', div.offsetHeight)
    .attr('class', 'bubble');


  // Render a bubble-thing of all the trackers
  var render_trackers = function(trackers) {
    var node = v.selectAll('g.node')
      .data(bubble.nodes({'children': trackers})
        .filter(function(d) { return !d.children; }))
      .enter().append('g')
        .attr('class', 'node')
        .on('click', function(targ) {
          var s = minsize / (4.0 * targ.r);
          // Center and zoom on the clicked node
          v.selectAll('path.pie').remove();
          v.selectAll('g.node').transition()
            .duration(500)
            .attr('transform', function(d) {
              var x = (d.x - targ.x) * s + div.offsetWidth / 2,
                  y = (d.y - targ.y) * s + div.offsetHeight / 2;
              return 'translate(' + x + ', ' + y + ') scale(' + s + ', ' + s + ')';
            });
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
    // First, build up the tree
    var tree = {children: rows};
    var path = v.selectAll('path.pie')
      .data(sunburst.nodes(tree))
      .enter().append('path')
      .attr('class', 'pie')
      .attr('d', arc)
      .attr('transform', function(d) {
        return 'translate(' + (div.offsetWidth / 2.0) + ', ' + (div.offsetHeight / 2.0) + ')';
      })
      .style('visibility', function(d) {
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

  };

  document.getElementById('content').addEventListener('click', function(e) {
    v.selectAll('path.pie').remove();
    v.selectAll('g.node').transition()
      .attr('transform', function(d) {
        return 'translate(' + d.x + ', ' + d.y + ') scale(1, 1)';
      });
  });

  db_get_trackers(render_trackers);
});

