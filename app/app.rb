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

    get '/', provides: :json do
      { hello: 'world' }.to_json
    end
  end
end
