$(function () {
  /* TODO */
  $('.submit-tab').hide()
  $('.profile-tab').hide()
  $('.minting-block').hide()
  $('.tags-showing-div .small-copy.caps').first().remove()
  // sign in with Discord + profile page
  // tags in resource blocks?

  $('.link-resources-block').css('height', '35%')
  $('.map-right-wrapper').css('width', '100%')

  const urlParams = new URLSearchParams(window.location.search)

  /* minting block */
  $.get(`${BASE_URI}/links/count`, function (data) {
    $('.minting-block .small-copy.right-align').text(`TOTAL SIGNALS: ${data.count}`)
  })

  /* orientation */
  $('.orientation').css('z-index', '99')
  $('.orientation-map').html('<div class="all-orientation">ALL</div>')
  $('.orientation-reset .orientation-reset').css('cursor', 'pointer').click(function () { window.location.href = '/' })
  $('.orientation-reset .orientation-random').css('cursor', 'pointer').click(function () { window.location.href = `${BASE_URI}/random` })

  /* search */
  $('.explore-tab-content .w-form').hide()
  const searchForm = $('<form style="margin-bottom: 15px"><input name="channel" type="hidden"><input name="q" type="text" class="w-input input-box" /></form>')
  searchForm.find('input[name=channel]').val(urlParams.get('channel'))
  searchForm.find('input[name=q]').val(urlParams.get('q'))
  $.each(urlParams.getAll('tags[]'), function (i, tag) {
    searchForm.append(`<input name="tags[]" type="hidden" value="${tag}">`)
  })
  searchForm.insertBefore('.explore-tab-content .w-form')

  /* selected tags */
  $('.tags-showing-div .showing-tags').hide()
  let tags = urlParams.getAll('tags[]')
  tags = tags.filter(function (item, pos) { return tags.indexOf(item) == pos }) // unique tags
  $(tags).each(function (i, tag) {
    const selectedTag = $('.tags-showing-div .showing-tags').first().clone()
    selectedTag.text(`${tag} ×`)
    selectedTag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
    selectedTag.css('color', '#ffffff')
    selectedTag.css('background-color', '#A706FA')
    selectedTag.insertAfter($('.tags-showing-div .showing-tags').last()).show()

    if (i == 0) { $('<div class="arrow">></div>').appendTo('.orientation-map') } else { $('<div class="arrow">&</div>').appendTo('.orientation-map') }
    $(`<div class="tag-orientation">${tag}</div>`).appendTo('.orientation-map')
  })
  $.get(`${BASE_URI}/tags/count`, function (data) {
    $('.tags-showing-div .small-copy.right-align').text(`${tags.length}/${data.count} tags`)
  })

  /* resources */
  $('.resource-block').hide()
  $.get(`${BASE_URI}/links?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
    $(data).each(function (i, link) {
      const resourceBlock = $('.resource-block').first().clone()

      resourceBlock.find('.resource-tldr').text('').html(link.data.title || truncate(link.data.description, 100, true) || truncate(link.data.url.replace(/^https?:\/\//, '').replace(/^www\./, ''), 44))

      resourceBlock.find('.resource-source').text('').text(link.data.provider?.name || link.data.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).click(function () { window.open(link.data.url) }).css('cursor', 'pointer')
      resourceBlock.find('.resource-curator').text('').text(`@${link.message.data.author.username}`).css('cursor', 'default')
      resourceBlock.find('.resource-expanded-content').text('')
      if (link.data.description) { resourceBlock.find('.resource-expanded-content').html(`<p class="small-copy">${link.data.description}</p>`).click(function () { window.open(link.data.url) }).css('cursor', 'pointer') }

      resourceBlock.find('.resource-icon-div .url-icon').click(function () { window.open(link.data.url) }).css('cursor', 'pointer')
      resourceBlock.find('.resource-icon-div .discord-icon').click(function () { window.open(`https://discord.com/channels/${GUILD_ID}/${link.message.data.channel_id}/${link.message.data.id}`) }).css('cursor', 'pointer')

      resourceBlock.find('.content-expander').css({ height: 'auto', opacity: 1 }).hide()
      resourceBlock.find('.open-arrow').css('cursor', 'pointer').click(function () {
        if (!resourceBlock.find('.content-expander').is(':visible')) {
          resourceBlock.find('.content-expander').slideDown()
          resourceBlock.find('.open-arrow').animate({ rotation: 180 },
            {
              duration: 500,
              step: function (now) {
                resourceBlock.find('.open-arrow').css({ transform: 'rotate(' + now + 'deg)' })
              }
            })
        } else {
          resourceBlock.find('.content-expander').slideUp()
          resourceBlock.find('.open-arrow').animate({ rotation: 0 },
            {
              duration: 500,
              step: function (now) {
                resourceBlock.find('.open-arrow').css({ transform: 'rotate(' + now + 'deg)' })
              }
            })
        }
      })
      resourceBlock.find('.resource-title').click(function () { resourceBlock.find('.resource-drop').click() }).css('cursor', 'pointer')

      $('<div class="tag-container-js"></div>').insertAfter(resourceBlock.find('.resource-expanded-content'))
      $(link.tagships).each(function (i, tagship) {
        const tag = $('.tags-showing-div .showing-tags').first().clone()
        tag.text(tagship.tag.name)
        if (urlParams.getAll('tags[]').includes(tagship.tag.name)) {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tagship.tag.name }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
          tag.css('color', '#ffffff')
          tag.css('background-color', '#A706FA')
        } else {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]').concat([tagship.tag.name]), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        }
        tag.appendTo(resourceBlock.find('.tag-container-js')).show()
      })

      resourceBlock.appendTo($('.link-resources-block').first()).show()
    })
  })

  /* channels */
  $('.channel-tag-wrapper').hide()
  $.get(`${BASE_URI}/channels`, function (data) {
    $(data).each(function (i, channel) {
      const channelBlock = $('.channel-tag-wrapper').first().clone()
      channelBlock.find('.channel-title a.channel-title').text(channel.name)

      channelBlock.find('.tags-button-container').css('height', 'auto').hide()
      channelBlock.find('.plus-icon').click(function () {
        if (!channelBlock.find('.tags-button-container').is(':visible')) {
          channelBlock.find('.tags-button-container').slideDown()
          channelBlock.find('.plus-icon').animate({ rotation: 135 },
            {
              duration: 500,
              step: function (now) {
                channelBlock.find('.plus-icon').css({ transform: 'rotate(' + now + 'deg)' })
              }
            })
        } else {
          channelBlock.find('.tags-button-container').slideUp()
          channelBlock.find('.plus-icon').animate({ rotation: 0 },
            {
              duration: 500,
              step: function (now) {
                channelBlock.find('.plus-icon').css({ transform: 'rotate(' + now + 'deg)' })
              }
            })
        }
      }).css('cursor', 'pointer')
      channelBlock.find('.channel-title a.channel-title').click(function () {
        window.location.href = `/?${$.param({ channel: channel.id, tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`
      }).css('cursor', 'pointer')

      if (channel.id == urlParams.get('channel')) {
        channelBlock.find('.plus-icon').click()

        const selectedTag = $('.tags-showing-div .showing-tags').first().clone()
        selectedTag.text(`${channel.name} ×`)
        selectedTag.click(function () { window.location.href = `/?${$.param({ tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        selectedTag.css('color', '#000000')
        selectedTag.css('background-color', '#FAC707')
        selectedTag.insertBefore($('.tags-showing-div .showing-tags').first()).show()

        $(`<div class="channel-orientation">${channel.name}</div>`).insertAfter('.orientation-map .all-orientation')
        $('<div class="arrow">></div>').insertAfter('.orientation-map .all-orientation')
      }

      channelBlock.find('.tags-button-container .tag-div-button').hide()
      channelBlock.find('.tag-counter').text(channel.tags.length)
      $(channel.tags).each(function (i, tagObj) {
        const tag = channelBlock.find('.tags-button-container .tag-div-button').first().clone()
        tag.text(`${tagObj.name} (${tagObj.count})`)
        if (channel.id == urlParams.get('channel') && urlParams.getAll('tags[]').includes(tagObj.name)) {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tagObj.name }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
          tag.addClass('selected')
        } else {
          const tags = (channel.id == urlParams.get('channel') ? urlParams.getAll('tags[]').concat([tagObj.name]) : [tagObj.name])
          tag.click(function () { window.location.href = `/?${$.param({ channel: channel.id, tags, q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        }
        tag.appendTo(channelBlock.find('.tags-button-container')).show()
      })

      channelBlock.appendTo('.channel-containter-scroll').show()
    })
  })
})

function truncate (str, n, useWordBoundary) {
  if (!str) { return '' }
  if (str.length <= n) { return str }
  const subString = str.slice(0, n - 1)
  return (useWordBoundary
    ? subString.slice(0, subString.lastIndexOf(' '))
    : subString) + '...'
};
