tags = []
console.log(`${BASE_URI}/tags`)
$.get(`${BASE_URI}/tags`, function (data) {
  tags = data
});


edges = []
$.get(`${BASE_URI}/edges`, function (data) {
  edges = data
});

function drawNetwork() {

  scale = chroma.scale(['#6D71C6', '#B16DC6']);

  node_min_width = 10
  node_width_multiplier = 10
  node_min_color = 0.1
  node_color_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight; }))
  edge_min_color = 0
  edge_color_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight; }))
  edge_min_opacity = 0
  edge_opacity_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight; }))


  tag_data = $.map(tags, function (tag, i) {
    return {
      data: {
        id: tag._id['$oid'],
        name: tag.name,
        weight: tag.weight,
        width: (node_min_width + ((node_min_width * node_width_multiplier) * tag.weight / node_color_scale)),
        color: scale(node_min_color + (tag.weight / node_color_scale)).hex()
      }
    }
  })

  edge_data = $.map(edges, function (edge, i) {
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
  })

  cy = cytoscape({

    container: $('#cy'),
    elements: tag_data.concat(edge_data),
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'opacity': 0.75,
          'color': 'black',
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
  $(document).ajaxComplete(function () {
    drawNetwork()
    $(window).one('focus', function () { drawNetwork() })
  })
})