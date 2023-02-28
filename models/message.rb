class Message
  include Mongoid::Document
  include Mongoid::Timestamps

  has_many :links, dependent: :destroy

  field :discord_id, type: String
  field :channel_id, type: String
  field :channel_name, type: String
  field :data, type: Hash

  index({ discord_id: 1 }, { unique: true })
  index({ channel_id: 1 })

  validates_presence_of :discord_id, :data
  validates_uniqueness_of :discord_id

  def self.admin_fields
    {
      discord_id: :text,
      channel_id: :text,
      channel_name: :text,
      data: { type: :text_area, disabled: true }
    }
  end

  before_validation do
    errors.add(:data, 'must have embeds') if data['embeds'].empty?
  end

  after_create do
    data['embeds'].each do |embed|
      links.create(url: embed['url'], data: embed)
    end
  end

  def self.active_thread_count
    c = 0
    threads = JSON.parse(DISCORD.get("guilds/#{ENV['GUILD_ID']}/threads/active").body)['threads']
    tc = threads.count
    threads.each_with_index do |thread, i|
      m = JSON.parse(DISCORD.get("channels/#{thread['id']}/messages").body).count
      puts "thread #{i + 1}/#{tc}: #{m} messages"
      c += m
    end
    c
  end

  def self.populate(n = nil)
    threads = JSON.parse(DISCORD.get("guilds/#{ENV['GUILD_ID']}/threads/active").body)['threads']
    threads = threads[0..n - 1] if n
    tc = threads.count
    threads.each_with_index do |thread, i|
      puts "thread #{i + 1}/#{tc}"
      channel = thread
      channel = JSON.parse(DISCORD.get("channels/#{thread['parent_id']}").body) while [10, 11, 12].include?(channel['type'])
      channel_id = thread['parent_id']
      channel_name = channel['name']

      JSON.parse(DISCORD.get("channels/#{thread['id']}/messages").body).each do |message_data|
        Message.create(discord_id: message_data['id'], channel_id: channel_id, channel_name: channel_name, data: message_data) unless message_data['embeds'].empty?
      end
    end
    tags = Tag.all
    c = tags.count
    tags.each_with_index do |tag, i|
      puts "tag #{i + 1}/#{c}: #{tag.name}"
      tag.create_tagships
    end
    edges = Edge.all
    c = edges.count
    edges.each_with_index do |edge, i|
      puts "edge #{i + 1}/#{c}: #{edge.summary}"
      edge.create_edgeships
    end
  end
end
