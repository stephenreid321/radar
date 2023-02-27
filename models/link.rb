class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message

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
end
