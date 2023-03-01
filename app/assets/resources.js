$(function () {

  $('.logo').click(function () { window.location.href = '/' }).css('cursor', 'pointer')
  $('.header').css('width', 'auto')
  $('.resources-block').hide()
  $('.categories').css('height', 'auto')

  urlParams = new URLSearchParams(window.location.search);

  $('.tags-divider').hide()
  $('.selected-tags-wrapper .tags').hide()
  // unique tags
  tags = urlParams.getAll('tags[]')
  tags = tags.filter(function (item, pos) { return tags.indexOf(item) == pos; })
  $(tags).each(function (i, tag) {
    var selectedTag = $('.selected-tags-wrapper .tags').first().clone()
    selectedTag.text(tag)
    selectedTag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
    selectedTag.css('border-color', '#A706FA')
    selectedTag.css('background-color', chroma('#A706FA').alpha(0.1).css())
    selectedTag.appendTo('.selected-tags-wrapper').show()
    $('.tags-divider').show()
  })

  $('<div class="category-blocks"></div>').insertAfter('.search-bar-div')
  $('.category-block').hide()
  $.get(`${BASE_URI}/channels`, function (data) {
    $(data).each(function (i, channel) {
      var categoryBlock = $('.category-block').first().clone()
      categoryBlock.find('.category-title .category-title').text(channel['name'])

      categoryBlock.find('.resources-content').css('height', 'auto').hide()
      categoryBlock.find('.category-drop').click(function () {
        if (!categoryBlock.find('.resources-content').is(':visible')) {
          categoryBlock.find('.resources-content').slideDown()
          categoryBlock.find('.category-drop').animate({ rotation: 135 },
            {
              duration: 500,
              step: function (now) {
                categoryBlock.find('.category-drop').css({ "transform": "rotate(" + now + "deg)" });
              }
            })
        } else {
          categoryBlock.find('.resources-content').slideUp()
          categoryBlock.find('.category-drop').animate({ rotation: 0 },
            {
              duration: 500,
              step: function (now) {
                categoryBlock.find('.category-drop').css({ "transform": "rotate(" + now + "deg)" });
              }
            })
        }
      }).css('cursor', 'pointer')
      categoryBlock.find('.category-title .category-title').click(function () { categoryBlock.find('.category-drop').click() }).css('cursor', 'pointer')

      if (channel['id'] == urlParams.get('channel')) {
        categoryBlock.find('.category-drop').click()

        var selectedTag = $('.selected-tags-wrapper .tags').first().clone()
        selectedTag.text(`# ${channel['name']}`)
        selectedTag.click(function () { window.location.href = `/?${$.param({ tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        selectedTag.css('border-color', '#A706FA')
        selectedTag.css('background-color', chroma('#A706FA').alpha(0.1).css())
        selectedTag.prependTo('.selected-tags-wrapper').show()
        $('.tags-divider').show()

        // categoryBlock.find('.resources-content').show()
        // categoryBlock.find('.category-drop').css({ "transform": "rotate(135deg)" })
      }

      categoryBlock.find('.tags').hide()
      $(channel['tags']).each(function (i, tag_name) {
        var tag = categoryBlock.find('.tags').first().clone()
        tag.text(tag_name)
        if (channel['id'] == urlParams.get('channel') && urlParams.getAll('tags[]').indexOf(tag_name) != -1) {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tag_name }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
          tag.css('border-color', '#A706FA')
          tag.css('background-color', chroma('#A706FA').alpha(0.1).css())
        } else {
          var tags = (channel['id'] == urlParams.get('channel') ? urlParams.getAll('tags[]').concat([tag_name]) : [tag_name])
          tag.click(function () { window.location.href = `/?${$.param({ channel: channel['id'], tags: tags, q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        }
        tag.appendTo(categoryBlock.find('.pricing-feature-list')).show()
      })

      categoryBlock.appendTo('.category-blocks').show()
    })
  })

  var searchForm = $('<form style="height: 100%"><input name="channel" type="hidden"><input name="q" type="text" style="padding-left: 0.5em; width: 100%; height: 100%" /></form>')
  searchForm.find('input[name=channel]').val(urlParams.get('channel'))
  searchForm.find('input[name=q]').val(urlParams.get('q'))
  $.each(urlParams.getAll('tags[]'), function (i, tag) {
    searchForm.append(`<input name="tags[]" type="hidden" value="${tag}">`)
  })

  searchForm.appendTo('.search-bar-div')
  $('.search-bar-div').css('background', 'none')
  $('.search-bar-div').css('padding', 0)

  $.get(`${BASE_URI}/links?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]'), q: urlParams.get('q') })}`, function (data) {
    $(data).each(function (i, link) {
      var resourceBlock = $('.resources-block').first().clone()

      resourceBlock.find('.resource-title').text('').html(link['data']['title'] || truncate(link['data']['description'], 100, true) || link['data']['url'].replace(/^https?:\/\//, '').replace(/^www\./, ''))

      resourceBlock.find('.platform').text('').text(link['data']['provider']?.['name'] || link['data']['url'].replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).click(function () { window.open(link['data']['url']) }).css('cursor', 'pointer')
      resourceBlock.find('.curator-name').text('').text(link['message']['data']['author']['username']).css('cursor', 'default')
      resourceBlock.find('.resource-description').text('')
      if (link['data']['description'])
        resourceBlock.find('.resource-description').html(`<p class="description-paragraph">${link['data']['description']}`).click(function () { window.open(link['data']['url']) }).css('cursor', 'pointer')

      resourceBlock.find('.resource-header-icons .web').click(function () { window.open(link['data']['url']) }).css('cursor', 'pointer')
      resourceBlock.find('.resource-header-icons .discord').click(function () { window.open(`https://discord.com/channels/${GUILD_ID}/${link['message']['data']['channel_id']}/${link['message']['data']['id']}`) }).css('cursor', 'pointer')

      resourceBlock.find('.resources-content').css('height', 'auto').hide()
      resourceBlock.find('.resource-drop').click(function () {
        if (!resourceBlock.find('.resources-content').is(':visible')) {
          resourceBlock.find('.resources-content').slideDown()
          resourceBlock.find('.resource-drop').animate({ rotation: 135 },
            {
              duration: 500,
              step: function (now) {
                resourceBlock.find('.resource-drop').css({ "transform": "rotate(" + now + "deg)" });
              }
            })
        } else {
          resourceBlock.find('.resources-content').slideUp()
          resourceBlock.find('.resource-drop').animate({ rotation: 0 },
            {
              duration: 500,
              step: function (now) {
                resourceBlock.find('.resource-drop').css({ "transform": "rotate(" + now + "deg)" });
              }
            })
        }
      })
      resourceBlock.find('.resource-title').click(function () { resourceBlock.find('.resource-drop').click() }).css('cursor', 'pointer')

      resourceBlock.find('.tags').hide()
      $(link['tagships']).each(function (i, tagship) {
        var tag = resourceBlock.find('.tags').first().clone()
        tag.text(tagship['tag']['name'])
        if (urlParams.getAll('tags[]').indexOf(tagship['tag']['name']) != -1) {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: $.grep(urlParams.getAll('tags[]'), function (value) { return value != tagship['tag']['name'] }), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
          tag.css('border-color', '#A706FA')
          tag.css('background-color', chroma('#A706FA').alpha(0.1).css())
        } else {
          tag.click(function () { window.location.href = `/?${$.param({ channel: urlParams.get('channel'), tags: urlParams.getAll('tags[]').concat([tagship['tag']['name']]), q: urlParams.get('q') })}` }).css('cursor', 'pointer')
        }
        tag.appendTo(resourceBlock.find('.list-item-2')).show()
      })

      resourceBlock.css('cursor', 'default')
      resourceBlock.appendTo($('.resources-stack').first()).show()
    })

  })

})

function truncate(str, n, useWordBoundary) {
  if (!str) { return ''; }
  if (str.length <= n) { return str; }
  const subString = str.slice(0, n - 1);
  return (useWordBoundary
    ? subString.slice(0, subString.lastIndexOf(" "))
    : subString) + "&hellip;";
};