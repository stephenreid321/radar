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

    get '/links', provides: :json do
      links = if params[:tag] && params[:tag] != 'null'
                Link.where(:id.in => Tagship.where(tag: Tag.find_by(name: params[:tag])).pluck(:link_id))
              else
                Link.all
              end
      if params[:q] && params[:q] != 'null'
        links = links.or(
          { 'data.title': /\b#{params[:q]}\b/i },
          { 'data.description': /\b#{params[:q]}\b/i }
        )
      end
      links.first(10).as_json(include: { message: {}, tagships: { include: :tag } }).to_json
    end

    get '/tags', provides: :json do
      Tag.where(
        :id.in => Tagship.where(:link_id.in => Link.or(
          { 'data.title': /\b#{params[:q]}\b/i },
          { 'data.description': /\b#{params[:q]}\b/i }
        ).pluck(:id)).pluck(:tag_id)
      ).as_json(include: [:edges_as_source, :edges_as_sink]).to_json
    end

    post '/tags', provides: :json do
      Tag.find_or_create_by!(name: params[:name]).to_json
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
      @phrase2_frequency = words.each_cons(2).reject { |a, b| stops.include?("#{a} #{b}") || (stops.include?(a) || stops.include?(b)) || (a.length < 4 || b.length < 4) }.each_with_object(Hash.new(0)) { |word, counts| counts[word.join(' ')] += 1 }
      erb :discover
    end

    get '/graph' do
      erb :graph
    end
  end
end
