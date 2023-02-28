class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message, index: true

  has_many :tagships, dependent: :destroy
  has_many :edgeships, dependent: :destroy

  field :url, type: String
  field :data, type: Hash

  validates_presence_of :url, :data
  validates_uniqueness_of :url, scope: :message_id

  def self.admin_fields
    {
      url: :url,
      data: { type: :text_area, disabled: true },
      message_id: :lookup
    }
  end

  after_create do
    Tag.all.each do |tag|
      tagships.create(tag: tag) if %w[title description].any? { |f| data[f] && data[f].match(/\b#{tag.name}\b/i) }
    end
    Edge.all.each do |edge|
      edgeships.create(edge: edge) if tagships.find_by(tag: edge.source) && tagships.find_by(tag: edge.sink)
    end
  end
end
