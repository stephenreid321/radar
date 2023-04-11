module Radar
  class App < Padrino::Application
    register Padrino::Rendering
    register Padrino::Helpers
    register WillPaginate::Sinatra
    register Padrino::Cache
    helpers Activate::ParamHelpers

    enable :caching unless Padrino.env == :development
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
      Faraday.get(ENV['WEBFLOW_URL']).body.gsub(ENV['DO_URL'], ENV['BASE_URI'])
    end

    get '/v1' do
      Faraday.get(ENV['WEBFLOW_V1_URL']).body.gsub(ENV['DO_URL'], ENV['BASE_URI'])
    end

    get '/random' do
      redirect "#{request.referrer.split('/').first if request.referrer}/?tags[]=#{Tag.collection.aggregate([{ '$sample': { size: 1 } }]).first['name']}"
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
      cache_key { 'channels' }
      Message.pluck(:channel_id, :channel_name).uniq.map do |channel_id, channel_name|
        {
          name: channel_name,
          id: channel_id,
          weight: 1,
          tags: Tag.where(:id.in =>
            Tagship.where(:link_id.in =>
              Link.where(:message_id.in =>
                Message.where(channel_id: channel_id).pluck(:id)).pluck(:id)).pluck(:tag_id)).pluck(:name)
        }
      end
             .select { |channel| channel[:tags].any? }
             .sort_by { |channel| channel[:name] }
             .to_json
    end

    get '/links', cache: true, provides: :json do
      cache_key { "links-#{params[:channel]}-#{params[:tags].try(:sort)}-#{params[:q]}" }
      links = Link.order('posted_at desc')
      if params[:tags]
        # Link.where(:id.in => Tagship.where(:tag_id.in => Tag.where(:name.in => params[:tags]).pluck(:id)).pluck(:link_id))
        link_ids = []
        params[:tags].each do |tag|
          if link_ids.empty?
            link_ids = Tagship.where(tag: Tag.find_by(name: tag)).pluck(:link_id)
          else
            link_ids &= Tagship.where(tag: Tag.find_by(name: tag)).pluck(:link_id)
          end
        end
        links = links.where(:id.in => link_ids)
      end
      if params[:channel]
        links = links.where(:message_id.in => Message.where(
          channel_id: params[:channel]
        ).pluck(:id))
      end
      if params[:q]
        links = links.where(:id.in => Link.or(
          { 'data.title': /\b#{params[:q]}\b/i },
          { 'data.description': /\b#{params[:q]}\b/i },
          { :tags_downcase.in => [params[:q].downcase] }
        ).pluck(:id))
      end
      links.limit(50).as_json(include: { message: {}, tagships: { include: :tag } }).to_json
    end

    get '/tags/count', cache: true, provides: :json do
      { count: Tag.count }.to_json
    end

    get '/tags', cache: true, provides: :json do
      cache_key { "tags-#{params[:channel]}-#{params[:tags].try(:sort)}-#{params[:q]}" }
      tags = if params[:tags]
               tag_ids = []
               Tag.where(:name.in => params[:tags]).each do |tag|
                 tag_ids_ = [tag.id] + tag.edges_as_source.where(:weight.gt => 0).pluck(:sink_id) + tag.edges_as_sink.where(:weight.gt => 0).pluck(:source_id)
                 if tag_ids.empty?
                   tag_ids = tag_ids_
                 else
                   tag_ids &= tag_ids_
                 end
               end
               Tag.where(:id.in => Tag.where(:name.in => params[:tags]).pluck(:id) + tag_ids)
             else
               Tag.all
             end
      if params[:channel]
        tags = tags.where(
          :id.in => Tagship.where(:link_id.in => Link.where(
            :message_id.in => Message.where(
              channel_id: params[:channel]
            ).pluck(:id)
          ).pluck(:id)).pluck(:tag_id)
        )
      end
      if params[:q]
        tags = tags.where(
          :id.in => Tagship.where(:link_id.in => Link.or(
            { 'data.title': /\b#{params[:q]}\b/i },
            { 'data.description': /\b#{params[:q]}\b/i },
            { :tags_downcase.in => [params[:q].downcase] }
          ).pluck(:id)).pluck(:tag_id)
        )
      end
      tags.as_json(include: [:edges_as_source, :edges_as_sink]).to_json
    end
  end
end
