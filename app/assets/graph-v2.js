function drawNetwork () {
  const scale = chroma.scale(['#ffffff', '#2500FF'])

  const channel_bg_color = '#000000'
  const channel_border_color = '#2500FF' // blue
  const tag_bg_color = '#2500FF'
  const tag_border_color = '#2500FF' // blue
  const link_bg_color = '#ffffff'
  const link_border_color = '#2500FF' // blue

  const channel_edge_color = '#2500FF' // blue
  const channel_edge_line_style = 'solid'
  const tag_edge_color = '#2500FF' // blue
  const tag_edge_line_style = 'solid'
  const link_edge_color = '#2500FF' // blue
  const link_edge_line_style = 'dashed'

  const channel_min_width = 10
  const channel_width_multiplier = 10
  const channel_min_color = 0.25
  const channel_color_scale = Math.max.apply(null, $(channels).map(function (i, channel) { return channel.weight }))
  const channel_min_opacity = 1
  const channel_opacity_scale = Math.max.apply(null, $(channels).map(function (i, channel) { return channel.weight }))

  const tag_min_width = 10
  const tag_width_multiplier = 10
  const tag_min_color = 0.25
  const tag_color_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight }))
  const tag_min_opacity = 1
  const tag_opacity_scale = Math.max.apply(null, $(tags).map(function (i, tag) { return tag.weight }))

  const link_min_width = 2.5
  const link_width_multiplier = 10
  // const link_min_color = 0.25
  const link_color_scale = Math.max.apply(null, $(links).map(function (i, link) { link.weight = 1; return link.weight }))
  const link_min_opacity = 1
  const link_opacity_scale = Math.max.apply(null, $(links).map(function (i, link) { link.weight = 1; return link.weight }))

  const edge_min_color = 1
  const edge_color_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight }))
  const edge_min_opacity = 0.1
  const edge_opacity_scale = Math.max.apply(null, $(edges).map(function (i, edge) { return edge.weight }))

  const channel_data = $.map(channels, function (channel, i) {
    let color
    if (urlParams.get('channel') == channel.name) { color = channel_bg_color } else { color = scale(channel_min_color + (channel.weight / channel_color_scale)).hex() }

    let opacity = channel_min_opacity + (channel.weight / channel_opacity_scale)
    if (opacity > 1) opacity = 1

    if (urlParams.get('channel') != channel.name) {
      return null
    } else {
      return {
        data: {
          type: 'channel',
          id: channel.name,
          name: channel.name,
          weight: channel.weight,
          width: (channel_min_width + ((channel_min_width * channel_width_multiplier) * channel.weight / channel_color_scale)),
          'border-color': channel_border_color,
          color,
          opacity
        }
      }
    }
  })

  const tag_data = $.map(tags, function (tag, i) {
    let color
    if (urlParams.getAll('tags[]').includes(tag.name)) { color = tag_bg_color } else { color = scale(tag_min_color + (tag.weight / tag_color_scale)).hex() }

    let opacity = tag_min_opacity + (tag.weight / tag_opacity_scale)
    if (opacity > 1) opacity = 1

    if (urlParams.getAll('tags[]').length > 0 && !urlParams.getAll('tags[]').includes(tag.name)) {
      return null
    } else {
      return {
        data: {
          type: 'tag',
          id: tag._id.$oid,
          name: tag.name,
          weight: tag.weight,
          width: (tag_min_width + ((tag_min_width * tag_width_multiplier) * tag.weight / tag_color_scale)),
          'border-color': color,
          color,
          opacity
        }
      }
    }
  })

  const tag_ids = $.map(tag_data, function (tag, i) {
    return tag.data.id
  })

  const edge_data = $.map(edges, function (edge, i) {
    if (
      urlParams.get('q') ||
      (urlParams.get('channel') && urlParams.getAll('tags[]').length == 0) ||
      (!urlParams.get('channel') && urlParams.getAll('tags[]').length == 0 && !urlParams.get('q')) ||
      edge.weight == 0 ||
      !tag_ids.includes(edge.source_id.$oid) ||
      !tag_ids.includes(edge.sink_id.$oid)
    ) {
      return null
    } else {
      let opacity = edge_min_opacity + (edge.weight / edge_opacity_scale)
      if (opacity > 1) opacity = 1

      return {
        data: {
          id: edge._id.$oid,
          source: edge.source_id.$oid,
          target: edge.sink_id.$oid,
          weight: edge.weight,
          color: scale(edge_min_color + (edge.weight / edge_color_scale)).hex(),
          opacity
        }
      }
    }
  })

  const link_data = $.map(links, function (link, i) {
    link.weight = 1
    const color = link_bg_color

    let opacity = link_min_opacity + (link.weight / link_opacity_scale)
    if (opacity > 1) opacity = 1

    return {
      data: {
        type: 'link',
        id: link._id.$oid,
        name: link.data.title || truncate(link.data.description, 100, true) || truncate(link.data.url.replace(/^https?:\/\//, '').replace(/^www\./, ''), 44),
        url: link.data.url,
        weight: link.weight,
        width: (link_min_width + ((link_min_width * link_width_multiplier) * link.weight / link_color_scale)),
        'border-color': link_border_color,
        color,
        opacity
      }
    }
  })

  $.each(links, function (i, link) {
    $.each(link.tagships, function (i, tagship) {
      if (!tag_ids.includes(tagship.tag_id.$oid)) {
        return null
      } else {
        edge_data.push({
          data: {
            id: `${tagship.tag_id.$oid}-${link._id.$oid}`,
            source: tagship.tag_id.$oid,
            target: link._id.$oid,
            weight: 1,
            color: link_edge_color,
            'line-style': link_edge_line_style,
            opacity: 0.5
          }
        })
      }
    })
  })

  if (urlParams.get('channel')) {
    const channel = urlParams.get('channel')
    $.each(tags, function (i, tag) {
      if (!tag_ids.includes(tag._id.$oid)) {
        return null
      } else {
        edge_data.push({
          data: {
            id: `${tag._id.$oid}-${channel}`,
            source: tag._id.$oid,
            target: channel,
            weight: 1,
            color: channel_edge_color,
            'line-style': channel_edge_line_style,
            opacity: 0.5
          }
        })
      }
    })
  }

  const radar_data = []
  if (urlParams.getAll('tags[]').length == 0 && !urlParams.get('channel') && !urlParams.get('q')) {
    radar_data.push({
      data: {
        type: 'RADAR',
        id: 'RADAR',
        name: 'RADAR',
        url: '/',
        weight: 1,
        width: 100,
        color: '#A706FA',
        opacity: 1
      }
    })
    $.each(tags, function (i, tag) {
      if (!tag_ids.includes(tag._id.$oid)) {
        return null
      } else {
        edge_data.push({
          data: {
            id: `${tag._id.$oid}-RADAR`,
            source: tag._id.$oid,
            target: 'RADAR',
            weight: 1,
            color: tag_edge_color,
            'line-style': tag_edge_line_style,
            opacity: 0.5
          }
        })
      }
    })
  }

  $('#graph').css('opacity', 0)
  const cy = cytoscape({

    container: $('#graph'),
    elements: channel_data.concat(tag_data).concat(link_data).concat(edge_data).concat(radar_data),
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          color: 'black',
          opacity: 'data(opacity)',
          'border-width': '1px',
          'border-style': 'solid',
          'border-color': function (node) { return node.data('border-color') },
          label: function (node) {
            if (node.data('type') === 'link') {
              return ''
            } else {
              return node.data('name')
            }
          },
          width: 'data(width)',
          height: 'data(width)'
        }
      },
      {
        selector: 'edge',
        style: {
          opacity: 'data(opacity)',
          'line-color': 'data(color)',
          'line-style': function (node) { return node.data('line-style') }
        }
      }
    ],
    layout: {
      name: 'cola',
      nodeSpacing: function (node) { return 40 }
    }

  })
  $('#graph').animate({ opacity: 1 })

  cy.on('mouseover', 'node', function (e) {
    $('#graph').css('cursor', 'pointer')
  })
  cy.on('mouseout', 'node', function (e) {
    $('#graph').css('cursor', 'default')
  })
  // cy.on('mouseover', 'edge', function (e) {
  //   $('#graph').css('cursor', 'pointer');
  // });
  // cy.on('mouseout', 'edge', function (e) {
  //   $('#graph').css('cursor', 'default');
  // });

  cy.on('tap', 'node', function (x, y) {
    const node = this
    if (node.data('type') == 'link') {
      const link_node = node
      window.open(link_node.data('url'))
    } else {
      $('#graph').fadeOut(function () {
        if (node.data('type') == 'RADAR') {
          window.location.href = '/'
        } else if (node.data('type') == 'channel') {
          const channel_node = node
          if (urlParams.get('channel') == channel_node.data('id')) { window.location.href = `/?${$.param({ tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}` } else { window.location.href = `/?${$.param({ channel: channel_node.data('id'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}` }
        } else if (node.data('type') == 'tag') {
          const tag_node = node
          if (urlParams.getAll('tags[]').includes(tag_node.data('name'))) { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag_node.data('name') }), q: urlParams.get('q') })}` } else { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]').concat([tag_node.data('name')]), q: urlParams.get('q') })}` }
        }
      })
    }
  })
  // cy.on('tap', 'edge', function () {
  //   window.location.href = `/?${$.param({ edge_id: this.data('id'), q: q })}`
  // });

  cy.nodes('[type="link"]').qtip({
    content: function () {
      return this.data('name')
    },
    show: {
      event: 'mouseover'
    },
    hide: {
      event: 'mouseout'
    },
    style: {
      classes: 'qtip-dark'
    }
  })

  cy.minZoom(0.5)
}

const urlParams = new URLSearchParams(window.location.search)

let channels = []
let tags = []
let links = []
const edges = []

$(function () {
  $('<div id="graph" style="height: 100%; width: 100%"></div>').insertAfter('.orientation')

  $.get(`${BASE_URI}/channels`, function (data) {
    channels = data
  }).then(function () {
    return $.get(`${BASE_URI}/tags?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
      tags = data
      $.each(tags, function (i, tag) {
        edges.push(...tag.edges_as_source)
      })
    })
  }).then(function () {
    if (urlParams.getAll('tags[]').length > 0 || urlParams.get('q')) {
      return $.get(`${BASE_URI}/links?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
        links = data
      })
    }
  }).then(function () {
    if (urlParams.get('q') && links.length == 0) {
      $('.no-signals-div').show()
    } else {
      drawNetwork()
      $(window).one('focus', function () { drawNetwork() })
    }
  })
})
