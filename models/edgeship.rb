class Edgeship
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :edge
  belongs_to :link

  def self.admin_fields
    {
      edge_id: :lookup,
      link_id: :lookup
    }
  end

  after_create :update_edge_weight
  after_destroy :update_edge_weight

  def update_edge_weight
    edge.update_attribute(:weight, edge.edgeships.count)
  end
end
