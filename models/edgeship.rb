class Edgeship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :edge, index: true
  belongs_to :link, index: true

  validates_uniqueness_of :edge, scope: :link

  attr_accessor :skip_update_weight

  def self.admin_fields
    {
      edge_id: :lookup,
      link_id: :lookup
    }
  end

  after_create :update_edge_weight, unless: -> { skip_update_weight }
  after_destroy :update_edge_weight, unless: -> { skip_update_weight }

  def update_edge_weight
    edge.update_weight
  end
end
