class Tag
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name, type: String

  validates_presence_of :name
  validates_uniqueness_of :name

  def self.admin_fields
    {
      name: :text
    }
  end
end
