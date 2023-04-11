class Tagship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :tag, index: true
  belongs_to :link, index: true

  validates_uniqueness_of :tag, scope: :link

  attr_accessor :skip_update_weight

  def self.admin_fields
    {
      summary: { type: :text, edit: false },
      tag_id: :lookup,
      link_id: :lookup
    }
  end

  def summary
    "#{tag.name} - #{link.title}"
  end

  after_create :update_tag_weight, unless: -> { skip_update_weight }
  after_destroy :update_tag_weight, unless: -> { skip_update_weight }

  def update_tag_weight
    tag.update_weight
  end
end
