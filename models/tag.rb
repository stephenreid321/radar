class Tag
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String
  field :weight, type: Integer, default: 0

  validates_presence_of :name
  validates_uniqueness_of :name

  has_many :tagships, dependent: :destroy
  has_many :edges_as_source, class_name: 'Edge', inverse_of: :source, dependent: :destroy
  has_many :edges_as_sink, class_name: 'Edge', inverse_of: :sink, dependent: :destroy

  def self.admin_fields
    {
      name: :text,
      weight: :number,
      tagships: :collection,
      edges_as_source: :collection,
      edges_as_sink: :collection
    }
  end

  def update_weight
    update_attribute(:weight, tagships.count)
  end

  def links
    Link.where(:tags.in => [name])
  end

  after_create :create_tagships
  def create_tagships
    links.each do |link|
      tagships.create(link: link, skip_update_weight: true)
    end
    update_weight
  end

  after_create :create_edges
  def create_edges
    Tag.all.each do |sink|
      Edge.find_or_create(self, sink)
    end
  end
end
