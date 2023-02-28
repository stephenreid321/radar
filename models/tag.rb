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
      weight: :number
    }
  end

  after_create do
    Link.or(
      { 'data.title': /\b#{name}\b/i },
      { 'data.description': /\b#{name}\b/i }
    ).each do |link|
      tagships.create(link: link)
    end
    Tag.all.each do |sink|
      Edge.find_or_create(self, sink)
    end
  end
end
