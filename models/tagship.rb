class Tagship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :tag
  belongs_to :link

  def self.admin_fields
    {
      tag_id: :lookup,
      link_id: :lookup
    }
  end
end
