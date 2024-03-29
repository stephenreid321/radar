module Radar
  class App < Padrino::Application
    register Padrino::Rendering
    register Padrino::Helpers
    register WillPaginate::Sinatra
    register Padrino::Cache
    helpers Activate::ParamHelpers

    enable :caching
    use Rack::Session::Cookie, expire_after: 1.year.to_i, secret: ENV['SESSION_SECRET']
    set :public_folder, Padrino.root('app', 'assets')
    use Rack::Cors do
      allow do
        origins '*'
        resource '*', headers: :any, methods: %i[get post patch put]
      end
    end

    before do
      redirect "#{ENV['BASE_URI']}#{request.path}" if ENV['BASE_URI'] && (ENV['BASE_URI'] != "#{request.scheme}://#{request.env['HTTP_HOST']}")
      if params[:r]
        Radar::App.cache.clear
        redirect request.path
      end
      fix_params!
      Time.zone = 'London'
      @og_image = ''
    end

    error do
      Airbrake.notify(env['sinatra.error'],
                      url: "#{ENV['BASE_URI']}#{request.path}",
                      params: params,
                      request: request.env.select { |_k, v| v.is_a?(String) },
                      session: session)
      erb :error, layout: :application
    end

    not_found do
      erb :not_found, layout: :application
    end

    get '/' do
      Faraday.get(ENV['WEBFLOW_URL']).body
             .gsub(ENV['DO_URL'], ENV['BASE_URI'])
             .gsub('<script src="https://api.radardao.xyz/static/signals/header.js"></script>', '')
             .gsub('<script src="https://api.radardao.xyz/static/signals/footer.js"></script>', '')
             .gsub('<script src="https://api.radardao.xyz/static/signals/home.js"></script>', '')
    end

    get '/v1' do
      Faraday.get(ENV['WEBFLOW_V1_URL']).body.gsub(ENV['DO_URL'], ENV['BASE_URI'])
    end

    get '/random' do
      t = Tag.collection.aggregate([{ '$sample': { size: 1 } }]).first['name']
      redirect "#{ENV['WEBFLOW_URL'] if Padrino.env == :production}/?tags[]=#{CGI.escape(t)}"
    end

    get '/invite' do
      bot = Discordrb::Bot.new(token: ENV['DISCORD_BOT_TOKEN'])
      bot.invite_url(permission_bits: 1024)
    end

    get '/populate' do
      halt unless params[:key] == ENV['POPULATE_KEY']
      Message.populate
      redirect '/'
    end

    get '/channels', cache: true, provides: :json do
      expires 12.hours.to_i
      cache_key { 'channels' }
      channels = Channel.all.map do |channel|
        {
          name: channel.name,
          id: channel.id,
          weight: 1,
          tags: channel.tags_with_count
        }
      end
                        .compact
                        .select { |channel| channel[:tags].any? }
                        .sort_by { |channel| channel[:name] }

      #  move daily signals to the top
      channels = channels.partition { |channel| channel[:name] =~ /signals-and-research/i }.flatten

      channels.to_json
    end

    get '/links/count', cache: true, provides: :json do
      expires 12.hours.to_i
      { count: Link.count }.to_json
    end

    get '/links', cache: true, provides: :json do
      expires 12.hours.to_i
      cache_key { "links-#{params[:channel]}-#{params[:tags].try(:sort)}-#{params[:q]}" }
      links = Link.order('posted_at desc')
      if params[:tags]
        link_ids = []
        params[:tags].each do |tag|
          if link_ids.empty?
            link_ids = Tagship.and(tag: Tag.find_by(name: tag)).pluck(:link_id)
          else
            link_ids &= Tagship.and(tag: Tag.find_by(name: tag)).pluck(:link_id)
          end
        end
        links = links.and(:id.in => link_ids)
      end
      links = links.and(:message_id.in => Channel.find_by(name: params[:channel]).messages.pluck(:id)) if params[:channel]
      if params[:q]
        links = links.and(:id.in => Link.or(
          { 'data.title': /\b#{params[:q]}\b/i },
          { 'data.description': /\b#{params[:q]}\b/i },
          { :tags_downcase.in => [params[:q].downcase] }
        ).pluck(:id))
      end
      links.limit(50).as_json(include: { message: {}, tagships: { include: :tag } }).to_json
    end

    get '/tags/count', cache: true, provides: :json do
      expires 12.hours.to_i
      { count: Tag.count }.to_json
    end

    get '/tags', cache: true, provides: :json do
      expires 12.hours.to_i
      cache_key { "tags-#{params[:channel]}-#{params[:tags].try(:sort)}-#{params[:q]}" }
      tags = if params[:tags]
               tag_ids = []
               Tag.and(:name.in => params[:tags]).each do |tag|
                 tag_ids_ = [tag.id] + tag.edges_as_source.and(:weight.gt => 0).pluck(:sink_id) + tag.edges_as_sink.and(:weight.gt => 0).pluck(:source_id)
                 if tag_ids.empty?
                   tag_ids = tag_ids_
                 else
                   tag_ids &= tag_ids_
                 end
               end
               Tag.and(:id.in => Tag.and(:name.in => params[:tags]).pluck(:id) + tag_ids)
             else
               Tag.all
             end
      if params[:channel]
        tags = tags.and(
          :id.in => Tagship.and(
            :link_id.in => Channel.find_by(name: params[:channel]).links.pluck(:id)
          ).pluck(:tag_id)
        )
      end
      if params[:q]
        links = params[:channel] ? Channel.find_by(name: params[:channel]).links : Link.all
        tags = tags.and(
          :id.in => Tagship.and(:link_id.in => links.and(:id.in => Link.or(
            { 'data.title': /\b#{params[:q]}\b/i },
            { 'data.description': /\b#{params[:q]}\b/i },
            { :tags_downcase.in => [params[:q].downcase] }
          ).pluck(:id)).pluck(:id)).pluck(:tag_id)
        )
      end
      tags.as_json(include: [:edges_as_source, :edges_as_sink]).to_json
    end
  end
end
