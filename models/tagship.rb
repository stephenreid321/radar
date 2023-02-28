class Tagship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :tag, index: true
  belongs_to :link, index: true

  def self.admin_fields
    {
      tag_id: :lookup,
      link_id: :lookup
    }
  end

  after_create :update_tag_weight
  after_destroy :update_tag_weight

  def update_tag_weight
    tag.update_attribute(:weight, tag.tagships.count)
  end
end
