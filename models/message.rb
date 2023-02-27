class Message
  include Mongoid::Document
  include Mongoid::Timestamps

  has_many :links, dependent: :destroy

  field :discord_id, type: String
  field :data, type: Hash

  validates_presence_of :discord_id, :data
  validates_uniqueness_of :discord_id

  def self.admin_fields
    {
      discord_id: :text,
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

  def self.populate!
    Message.delete_all
    Link.delete_all
    JSON.parse(DISCORD.get("guilds/#{ENV['GUILD_ID']}/threads/active").body)['threads'].each do |thread|
      channel_id = thread['id']
      JSON.parse(DISCORD.get("channels/#{channel_id}/messages").body).each do |message_data|
        Message.create(discord_id: message_data['id'], data: message_data)
      end
    end
  end
end
