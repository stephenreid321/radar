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
      Faraday.get('https://radar-knowledge-graph.webflow.io/').body.gsub('https://radar-knowledgegraph.herokuapp.com', ENV['BASE_URI'])
    end

    get '/invite' do
      bot = Discordrb::Bot.new(token: ENV['DISCORD_BOT_TOKEN'])
      bot.invite_url(permission_bits: 1024)
    end

    get '/channels', cache: true, provides: :json do
      cache_key { 'channels' }
      Message.distinct(:channel_id).map do |channel_id|
        channel_name = Message.where(channel_id: channel_id).first.channel_name
        {
          name: channel_name,
          id: channel_id,
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
      cache_key { "links-#{params[:channel]}-#{params[:tags].sort}-#{params[:q]}" }
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
          { 'data.description': /\b#{params[:q]}\b/i }
        ).pluck(:id))
      end
      links.limit(50).as_json(include: { message: {}, tagships: { include: :tag } }).to_json
    end

    get '/tags', cache: true, provides: :json do
      cache_key { "tags-#{params[:channel]}-#{params[:tags].sort}-#{params[:q]}" }
      tags = if params[:tags]
               tags = Tag.where(:name.in => params[:tags])
               Tag.where(:id.in => tags.pluck(:id) + Edge.where(:weight.gt => 0).where(:source_id.in => tags.pluck(:id)).pluck(:sink_id) + Edge.where(:weight.gt => 0).where(:sink_id.in => tags.pluck(:id)).pluck(:source_id))
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
            { 'data.description': /\b#{params[:q]}\b/i }
          ).pluck(:id)).pluck(:tag_id)
        )
      end
      tags.as_json(include: [:edges_as_source, :edges_as_sink]).to_json
    end

    post '/tags', provides: :json do
      Tag.find_or_create_by!(name: params[:name]).to_json
      Radar::App.cache.clear
    end

    get '/discover' do
      stops = STOPS
      stops += Tag.all.pluck(:name)

      text = []
      Link.all.each do |link|
        text << link['data']['title']
        text << link['data']['description']
      end
      text = text.flatten.join(' ').downcase
      words = text.split(' ')
      @word_frequency = words.reject { |a| stops.include?(a) || a.length < 4 }.each_with_object(Hash.new(0)) { |word, counts| counts[word] += 1 }
      @phrase2_frequency = words.each_cons(2).reject { |a, b| stops.include?("#{a} #{b}") || (a.length < 4 || b.length < 4) }.each_with_object(Hash.new(0)) { |word, counts| counts[word.join(' ')] += 1 }
      erb :discover
    end

    get '/graph' do
      erb :graph
    end
  end
end
