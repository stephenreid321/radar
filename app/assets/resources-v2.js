$(function () {
  $('.link-resources-block').css('height', '50%')
  $('.resource-block').hide()
  const urlParams = new URLSearchParams(window.location.search)

  /*
  <div class="resource-block">
    <div class="resource-icon-div">
      <div class="url-icon"></div>
      <div class="discord-icon"></div>
    </div>
    <p class="resource-tldr">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros
      elementum tristique...</p>
    <div class="resource-source">Source</div>
    <div class="resource-curator">@Curator </div>
    <div data-w-id="c4effaef-c93e-f3f0-c495-ecb3cacf62c6" class="resource-expand">
      <div class="open-arrow"><img
          src="https://uploads-ssl.webflow.com/6429251470b4df48f448b756/642bb5658014256aeb99fec4_arrow_open.png" alt=""
          class="plus-icon"></div>
      <div style="height: 0px; opacity: 0;" class="content-expander">
        <div class="resource-expanded-content">
          <p class="small-copy">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros
            elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero
            vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique
            posuere.</p>
        </div>
      </div>
    </div>
  </div>
  */
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

      resourceBlock.appendTo($('.link-resources-block').first()).show()
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
