class Linkship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message
  belongs_to :link

  def self.admin_fields
    {
      message_id: :lookup,
      link_id: :lookup,
    }
  end
end
