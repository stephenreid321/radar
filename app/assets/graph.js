function drawNetwork() {

  scale = chroma.scale(['#fff', '#999']);

  channel_min_width = 10
  channel_width_multiplier = 10
  channel_min_color = 0.25
  channel_color_scale = Math.max.apply(null, $(channels).map(function (i, channel) { return channel.weight }))
  channel_min_opacity = 1
  channel_opacity_scale = Math.max.apply(null, $(channels).map(function (i, channel) { return channel.weight }))

  tag_min_width = 10
  tag_width_multiplier = 10
  tag_min_color = 0.25
  tag_color_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight }))
  tag_min_opacity = 1
  tag_opacity_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight }))

  edge_min_color = 1
  edge_color_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight }))
  edge_min_opacity = 0.1
  edge_opacity_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight }))

  channel_data = $.map(channels, function (channel, i) {
    if (urlParams.get('channel') == channel.id)
      color = '#FAC706'
    else
      color = scale(channel_min_color + (channel.weight / channel_color_scale)).hex()

    opacity = channel_min_opacity + (channel.weight / channel_opacity_scale)
    if (opacity > 1) opacity = 1

    if (urlParams.get('channel') != channel.id) {
      return null
    } else {
      return {
        data: {
          type: 'channel',
          id: channel.id,
          name: channel.name,
          weight: channel.weight,
          width: (channel_min_width + ((channel_min_width * channel_width_multiplier) * channel.weight / channel_color_scale)),
          color: color,
          opacity: opacity
        }
      }
    }
  })

  tag_ids = $.map(tags, function (tag, i) {
    return tag._id['$oid']
  })

  tag_data = $.map(tags, function (tag, i) {
    if (urlParams.getAll('tags[]').indexOf(tag.name) != -1)
      color = '#A706FA'
    else
      color = scale(tag_min_color + (tag.weight / tag_color_scale)).hex()

    opacity = tag_min_opacity + (tag.weight / tag_opacity_scale)
    if (opacity > 1) opacity = 1

    return {
      data: {
        type: 'tag',
        id: tag._id['$oid'],
        name: tag.name,
        weight: tag.weight,
        width: (tag_min_width + ((tag_min_width * tag_width_multiplier) * tag.weight / tag_color_scale)),
        color: color,
        opacity: opacity
      }
    }
  })

  edge_data = $.map(edges, function (edge, i) {
    if (edge.weight == 0 || tag_ids.indexOf(edge.source_id['$oid']) == -1 || tag_ids.indexOf(edge.sink_id['$oid']) == -1) {
      return null
    } else {

      opacity = edge_min_opacity + (edge.weight / edge_opacity_scale)
      if (opacity > 1) opacity = 1

      return {
        data: {
          id: edge._id['$oid'],
          source: edge.source_id['$oid'],
          target: edge.sink_id['$oid'],
          weight: edge.weight,
          color: scale(edge_min_color + (edge.weight / edge_color_scale)).hex(),
          opacity: opacity
        }
      }
    }
  })

  if (urlParams.get('channel') != null) {
    var channel = urlParams.get('channel')
    $.each(tags, function (i, tag) {
      edge_data.push({
        data: {
          id: `${tag._id['$oid']}-${channel.id}`,
          source: tag._id['$oid'],
          target: channel,
          weight: 1,
          color: '#999',
          opacity: 0.5
        }
      })
    })
  }

  $('#graph').css('opacity', 0)
  cy = cytoscape({

    container: $('#graph'),
    elements: channel_data.concat(tag_data).concat(edge_data),
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
  $('#graph').animate({ opacity: 1 })

  cy.on('mouseover', 'node', function (e) {
    $('#graph').css('cursor', 'pointer');
  });
  cy.on('mouseout', 'node', function (e) {
    $('#graph').css('cursor', 'default');
  });
  // cy.on('mouseover', 'edge', function (e) {
  //   $('#graph').css('cursor', 'pointer');
  // });
  // cy.on('mouseout', 'edge', function (e) {
  //   $('#graph').css('cursor', 'default');
  // });

  cy.on('tap', 'node', function (x, y) {
    var node = this
    $('#graph').fadeOut(function () {
      if (node.data('type') == 'channel') {
        var channel_node = node
        if (urlParams.get('channel') == channel_node.data('id'))
          window.location.href = `/?${$.param({ tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`
        else
          window.location.href = `/?${$.param({ channel: channel_node.data('id'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`
      } else if (node.data('type') == 'tag') {
        var tag_node = node
        if (urlParams.getAll('tags[]').indexOf(tag_node.data('name')) != -1)
          window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag_node.data('name') }), q: urlParams.get('q') })}`
        else
          window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]').concat([tag_node.data('name')]), q: urlParams.get('q') })}`
      }
    })
  });
  // cy.on('tap', 'edge', function () {
  //   window.location.href = `/?${$.param({ edge_id: this.data('id'), q: q })}`
  // });
  cy.minZoom(0.5)

}

$(function () {

  urlParams = new URLSearchParams(window.location.search);

  channels = []
  tags = []
  edges = []

  $('<div style="width: 100%; height: 100%" id="graph"></div>').appendTo('.full-screen')

  $.get(`${BASE_URI}/channels`, function (data) {
    channels = data
  }).then(function () {
    return $.get(`${BASE_URI}/tags?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
      tags = data
      $.each(tags, function (i, tag) {
        edges.push(...tag['edges_as_source'])
      })
    })
  }).then(function () {
    drawNetwork()
    $(window).one('focus', function () { drawNetwork() })
  })

})