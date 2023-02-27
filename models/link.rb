class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message
  has_many :tagships, dependent: :destroy

  field :url, type: String
  field :data, type: Hash

  validates_presence_of :url, :data
  validates_uniqueness_of :url, scope: :message_id

  def self.admin_fields
    {
      message_id: :lookup,
      url: :url,
      data: { type: :text_area, disabled: true }
    }
  end

  after_create do
    Tag.all.each do |tag|
      tagships.create(tag: tag) if %w[title description].any? { |f| data[f] && data[f].include?(tag.name) }
    end
  end
end
