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

  def self.populate!
    Edge.destroy_all
    Tag.all.each do |source|
      Tag.all.each do |sink|
        find_or_create(source, sink)
      end
    end
  end

  def self.find_or_create(source, sink)
    if !(edge = find_by(source: source, sink: sink)) && !(edge = find_by(source: sink, sink: source)) && source != sink
      puts "creating edge for #{source.name} - #{sink.name}"
      edge = create(source: source, sink: sink)
    end
    edge
  end
end
