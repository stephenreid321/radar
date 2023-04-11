class Link
  include Mongoid::Document
  include Mongoid::Timestamps

  belongs_to :message, index: true

  has_many :tagships, dependent: :destroy
  has_many :edgeships, dependent: :destroy

  field :url, type: String
  field :data, type: Hash
  field :posted_at, type: Time
  field :tags, type: Array
  field :tags_downcase, type: Array
  field :tagged_at, type: Time

  index({ url: 1 })
  index({ posted_at: 1 })
  index({ tags: 1 })
  index({ tags_downcase: 1 })

  validates_presence_of :url, :data
  validates_uniqueness_of :url, scope: :message_id

  before_validation do
    self.posted_at = message.posted_at if posted_at.blank?
  end

  after_create do
    set_tags!
  end

  def self.admin_fields
    {
      url: :url,
      title: { type: :text, disabled: true },
      description: { type: :text, disabled: true },
      data: { type: :text_area, disabled: true },
      prompt: { type: :text_area, disabled: true },
      tags: { type: :text_area, disabled: true, full: true },
      posted_at: :datetime,
      message_id: :lookup,
      tagships: :collection,
      edgeships: :collection
    }
  end

  def title
    data['title']
  end

  def description
    data['description']
  end

  def prompt
    %(
      # Terms
      #{Tag.pluck(:name).join("\n")}

      # Link
      Title: #{title}
      URL: #{url}
      Description: #{description}

      ---
      Select up to 5 terms from the list of terms that are most relevant to the link.
      IMPORTANT: Only select terms that are present in the list of terms.
      Return the result as a comma-separated list.
    )
  end

  def self.taggable
    where(:title.ne => nil, :description.ne => nil)
  end

  def set_tags!(attempt: 1, force: false)
    unless force
      return if tags && !tags.empty?
      return unless title && description
    end

    puts "tagging #{url} (attempt #{attempt})"
    n = 1
    openai_response = OPENAI.post('chat/completions') do |req|
      req.body = { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }] }.to_json
    end
    raise Faraday::TimeoutError if JSON.parse(openai_response.body)['error']

    update_attribute(:tagged_at, Time.now)

    content = JSON.parse(openai_response.body)['choices'][0]['message']['content']
    content = content[0..-2] if content[-1] == '.'
    puts "1. #{content}"
    tags = content.split(', ').map(&:strip)
    tags = tags.select { |t| Tag.pluck(:name).include?(t) }
    puts "2. #{tags.join(', ')}"
    if tags.count > 0
      update_attribute(:tags, tags)
      update_attribute(:tags_downcase, tags.map(&:downcase))
    end
  rescue Faraday::TimeoutError
    sleep 1
    set_tags!(attempt: attempt + 1, force: force) if attempt < 3
  end
end
