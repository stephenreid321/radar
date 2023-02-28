$(function () {


  // TODO
  $('.tags-divider').hide()
  $('.category-block').hide()
  $('.categories').css('height', 'auto')

  $('.resources-block').hide()

  urlParams = new URLSearchParams(window.location.search);
  var q = urlParams.get('q')
  var tag = urlParams.get('tag')

  var searchForm = $('<form style="height: 100%"><input name="q" type="text" style="padding-left: 0.5em; width: 100%; height: 100%" /></form>')
  searchForm.find('input').val(q)

  searchForm.appendTo('.search-bar-div')
  $('.search-bar-div').css('padding', 0)

  $.get(`${BASE_URI}/links?tag=${tag}&q=${q}`, function (data) {
    $(data).each(function (i, link) {
      var resourceBlock = $('.resources-block').first().clone()

      resourceBlock.find('.resource-title').text('').text(link['data']['title'] || link['data']['description'] || link['data']['url'].replace(/^https?:\/\//, '').replace(/^www\./, ''))
      resourceBlock.find('.curator-name').text('').text(link['message']['data']['author']['username'])
      resourceBlock.find('.platform').text('').text(link['data']['provider']?.['name'] || link['data']['url'].replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
      resourceBlock.find('.resource-description').text('')
      if (link['data']['description'])
        resourceBlock.find('.resource-description').html(`<p class="description-paragraph">${link['data']['description']}`)

      resourceBlock.find('.resource-header-icons .web').click(function () { window.open(link['data']['url']) })
      resourceBlock.find('.resource-header-icons .discord').click(function () { window.open(`https://discord.com/channels/${GUILD_ID}/${link['message']['data']['channel_id']}/${link['message']['data']['id']}`) })
      resourceBlock.find('.resources-content').css('height', 'auto')

      resourceBlock.find('.tags').hide()
      $(link['tagships']).each(function (i, tagship) {
        var tag = resourceBlock.find('.tags').first().clone()
        tag.click(function () { window.location.href = `/?tag=${tagship['tag']['name']}` })
        tag.text(tagship['tag']['name'])
        tag.appendTo(resourceBlock.find('.list-item-2')).show()
      })

      resourceBlock.appendTo($('.resources-stack').first()).show()
    })

  })

})