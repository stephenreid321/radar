class Channel
  include Mongoid::Document
  include Mongoid::Timestamps

  field :discord_id, type: String
  field :name, type: String

  has_many :messages, dependent: :destroy
  has_many :links, dependent: :destroy

  index({ discord_id: 1 }, { unique: true })
  index({ name: 1 })

  validates_presence_of :discord_id, :name
  validates_uniqueness_of :discord_id

  def self.admin_fields
    {      
      name: :text,
      discord_id: :text      
    }
  end

  before_validation do
    errors.add(:name, 'is invalid') unless (name =~ /\A[a-z]/i || name =~ /signals-and-research/i) && (name != ~ /intothefuture-promo-temp/i)    
  end

  def tags_with_count    
    Tag.and(:id.in =>
      Tagship.and(
          :link_id.in => links.pluck(:id)
        ).pluck(:tag_id)
      ).map do |tag|
            count = Padrino.env == :development ? 0 : Tagship.and(tag: tag).and(:link_id.in => links.pluck(:id)).count
            { name: tag.name, count: count }
          end
  end
  
end
