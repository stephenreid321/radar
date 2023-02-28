function drawNetwork() {

  scale = chroma.scale(['#fff', '#999']);

  node_min_width = 10
  node_width_multiplier = 10
  node_min_color = 0.25
  node_color_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight; }))
  node_min_opacity = 1
  node_opacity_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight; }))

  edge_min_color = 1
  edge_color_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight; }))
  edge_min_opacity = 0.25
  edge_opacity_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight; }))

  tag_ids = $.map(tags, function (tag, i) {
    return tag._id['$oid']
  })

  tag_data = $.map(tags, function (tag, i) {
    return {
      data: {
        id: tag._id['$oid'],
        name: tag.name,
        weight: tag.weight,
        width: (node_min_width + ((node_min_width * node_width_multiplier) * tag.weight / node_color_scale)),
        color: scale(node_min_color + (tag.weight / node_color_scale)).hex(),
        opacity: node_min_opacity + (tag.weight / node_opacity_scale)
      }
    }
  })

  edge_data = $.map(edges, function (edge, i) {
    if (tag_ids.indexOf(edge.source_id['$oid']) == -1 || tag_ids.indexOf(edge.sink_id['$oid']) == -1) {
      return null
    } else {
      return {
        data: {
          id: edge._id['$oid'],
          source: edge.source_id['$oid'],
          target: edge.sink_id['$oid'],
          weight: edge.weight,
          color: scale(edge_min_color + edge.weight / edge_color_scale).hex(),
          opacity: (edge_min_opacity + (edge.weight / edge_opacity_scale))
        }
      }
    }
  }).filter(function (edge) { return edge != null })

  cy = cytoscape({

    container: $('.full-screen'),
    elements: tag_data.concat(edge_data),
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'color': 'black',
          'opacity': 'data(opacity)',
          'label': 'data(name)',
          'width': 'data(width)',
          'height': 'data(width)'
        }
      },
      {
        selector: 'edge',
        style: {
          'opacity': 'data(opacity)',
          'line-color': 'data(color)',
        }
      }
    ],
    layout: {
      name: 'cola',
      nodeSpacing: function (node) { return 40; },
    }

  });
  cy.on('tap', 'node', function () {
    window.location.href = '/terms/' + this.data('name');
  });
  cy.on('tap', 'edge', function () {
    window.location.href = '/edges/' + this.data('id');
  });
  cy.minZoom(0.5)

}

$(function () {

  urlParams = new URLSearchParams(window.location.search);
  var q = urlParams.get('q')

  tags = []
  edges = []

  $.get(`${BASE_URI}/tags?q=${q}`, function (data) {
    tags = data
    $.each(tags, function (i, tag) {
      edges.push(...tag['edges_as_source'])
      edges.push(...tag['edges_as_sink'])
    })
    drawNetwork()
    $(window).one('focus', function () { drawNetwork() })
  })

})