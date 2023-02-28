class Edge
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :source, class_name: 'Tag', inverse_of: :tags_as_source, index: true
  belongs_to :sink, class_name: 'Tag', inverse_of: :tags_as_sink, index: true

  has_many :edgeships, dependent: :destroy

  field :weight, type: Integer, default: 0

  def self.admin_fields
    {
      summary: { type: :text, edit: false },
      weight: :number,
      source_id: :lookup,
      sink_id: :lookup
    }
  end

  validates_uniqueness_of :source, scope: :sink

  def summary
    "#{source.name} - #{sink.name}"
  end

  def self.find_or_create(source, sink)
    if !(edge = find_by(source: source, sink: sink)) && !(edge = find_by(source: sink, sink: source)) && source != sink
      edge = create(source: source, sink: sink)
    end
    edge
  end

  def update_weight
    update_attribute(:weight, edgeships.count)
  end

  def links
    Link.where(:id.in => source.tagships.pluck(:link_id) & sink.tagships.pluck(:link_id))
  end

  after_create :create_edgeships
  def create_edgeships
    links.each do |link|
      edgeships.create(link: link, skip_update_weight: true)
    end
    update_weight
  end
end
