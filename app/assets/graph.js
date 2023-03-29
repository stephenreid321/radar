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

  link_min_width = 2.5
  link_width_multiplier = 10
  link_min_color = 0.25
  link_color_scale = Math.max.apply(null, $(links).map(function (i, link) { link.weight = 1; return link.weight }))
  link_min_opacity = 1
  link_opacity_scale = Math.max.apply(null, $(links).map(function (i, link) { link.weight = 1; return link.weight }))

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

  tag_data = $.map(tags, function (tag, i) {
    if (urlParams.getAll('tags[]').includes(tag.name))
      color = '#A706FA'
    else
      color = scale(tag_min_color + (tag.weight / tag_color_scale)).hex()

    opacity = tag_min_opacity + (tag.weight / tag_opacity_scale)
    if (opacity > 1) opacity = 1

    if (urlParams.getAll('tags[]').length > 0 && !urlParams.getAll('tags[]').includes(tag.name)) {
      return null
    } else {
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
    }
  })

  tag_ids = $.map(tag_data, function (tag, i) {
    return tag.data.id;
  })

  edge_data = $.map(edges, function (edge, i) {
    if (edge.weight == 0 || !tag_ids.includes(edge.source_id['$oid']) || !tag_ids.includes(edge.sink_id['$oid'])) {
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

  link_data = $.map(links, function (link, i) {
    link.weight = 1
    color = '#07FA98'

    opacity = link_min_opacity + (link.weight / link_opacity_scale)
    if (opacity > 1) opacity = 1

    return {
      data: {
        type: 'link',
        id: link._id['$oid'],
        name: link.data.title || truncate(link.data.description, 100, true) || link.data.url.replace(/^https?:\/\//, '').replace(/^www\./, ''),
        url: link.data.url,
        weight: link.weight,
        width: (link_min_width + ((link_min_width * link_width_multiplier) * link.weight / link_color_scale)),
        color: color,
        opacity: opacity
      }
    }
  })

  $.each(links, function (i, link) {
    $.each(link.tagships, function (i, tagship) {
      if (!tag_ids.includes(tagship.tag_id['$oid'])) {
        return null
      } else {
        edge_data.push({
          data: {
            id: `${tagship.tag_id['$oid']}-${link._id['$oid']}`,
            source: tagship.tag_id['$oid'],
            target: link._id['$oid'],
            weight: 1,
            color: '#999',
            opacity: 0.5
          }
        })
      }
    })
  })

  if (urlParams.get('channel')) {
    var channel = urlParams.get('channel')
    $.each(tags, function (i, tag) {
      if (!tag_ids.includes(tag._id['$oid'])) {
        return null
      } else {
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
      }
    })
  }

  $('#graph').css('opacity', 0)
  cy = cytoscape({

    container: $('#graph'),
    elements: channel_data.concat(tag_data).concat(link_data).concat(edge_data),
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
      nodeSpacing: function (node) { return 40; }
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
    if (node.data('type') == 'link') {
      var link_node = node
      window.open(link_node.data('url'))
    } else {
      $('#graph').fadeOut(function () {
        if (node.data('type') == 'channel') {
          var channel_node = node
          if (urlParams.get('channel') == channel_node.data('id'))
            window.location.href = `/?${$.param({ tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`
          else
            window.location.href = `/?${$.param({ channel: channel_node.data('id'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`
        } else if (node.data('type') == 'tag') {
          var tag_node = node
          if (urlParams.getAll('tags[]').includes(tag_node.data('name')))
            window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag_node.data('name') }), q: urlParams.get('q') })}`
          else
            window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]').concat([tag_node.data('name')]), q: urlParams.get('q') })}`
        }
      })
    }
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
  links = []

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
    if (urlParams.getAll('tags[]').length > 0)
      return $.get(`${BASE_URI}/links?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
        links = data
      })
  }).then(function () {
    drawNetwork()
    $(window).one('focus', function () { drawNetwork() })
  })

})