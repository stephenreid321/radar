class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message, index: true

  has_many :tagships, dependent: :destroy
  has_many :edgeships, dependent: :destroy

  field :url, type: String
  field :data, type: Hash
  field :posted_at, type: Time

  index({ url: 1 })
  index({ posted_at: 1 })

  validates_presence_of :url, :data
  validates_uniqueness_of :url, scope: :message_id

  before_validation do
    self.posted_at = message.posted_at if posted_at.blank?
  end

  def self.admin_fields
    {
      url: :url,
      data: { type: :text_area, disabled: true },
      posted_at: :datetime,
      message_id: :lookup
    }
  end
end
