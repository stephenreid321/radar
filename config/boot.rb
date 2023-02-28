# Defines our constants
RACK_ENV = ENV['RACK_ENV'] ||= 'development' unless defined?(RACK_ENV)
PADRINO_ROOT = File.expand_path('..', __dir__) unless defined?(PADRINO_ROOT)

# Load our dependencies
require 'rubygems' unless defined?(Gem)
require 'bundler/setup'
require 'open-uri'
require 'active_support/all'
Bundler.require(:default, RACK_ENV)

Padrino.load!

Mongoid.load!("#{PADRINO_ROOT}/config/mongoid.yml")
Mongoid.raise_not_found_error = false

Delayed::Worker.max_attempts = 1

String.send(:define_method, :html_safe?) { true }

DISCORD = Faraday.new(
  url: 'https://discord.com/api/v9',
  headers: { 'Content-Type': 'Application/json', Authorization: "Bot #{ENV['DISCORD_BOT_TOKEN']}" }
)
