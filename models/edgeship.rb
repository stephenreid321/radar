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

  after_save do
    edge.update_attribute(:weight, edge.edgeships.count)
  end
end
