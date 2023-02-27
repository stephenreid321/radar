class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  has_many :linkships, dependent: :destroy

  field :url, type: String
  field :data, type: Hash

  def self.admin_fields
    {
      url: :url,
      data: { type: :text_area, disabled: true }
    }
  end
end
