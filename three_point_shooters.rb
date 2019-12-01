# Inspired by 
# https://medium.freecodecamp.org/how-to-scrape-with-ruby-and-nokogiri-and-map-the-data-bd9febb5e18a

require 'open-uri'

# gem install nokogiri
# gem install terminal-table
require 'nokogiri'
require 'terminal-table'

def fetch_players
  url = 'https://en.wikipedia.org/wiki/List_of_National_Basketball_Association_career_3-point_scoring_leaders'
  html = open(url)
  doc = Nokogiri::HTML(html)
  players = []
  table = doc.at('//*[@id="mw-content-text"]/div/table[2]')

  table.search('tbody tr').each do |tr|
    cells = tr.search('td')
    next if cells.empty?

    players.push(
      name: cells[1].text,
      years_played: compact_begin_end_years(cells[3].text), 
      three_pointers_made: cells[4].text,
      field_goal_percentage: cells[6].text
    )
  end

  players
end

def compact_begin_end_years(years_str)
  years_str.gsub!('present', Time.new.year.to_s)
  result = years_str.scan(/\(\d.*?\d\)/)
  result = result.map do |begin_end_year_pair|
    begin_end_year_pair.gsub!(/\(|\)/, '')
    begin_end_year_pair.gsub!("\u2013", ',')
    begin_end_year_pair.split(",").map!(&:to_i)
  end

  result = result.flatten.sort
  [result.first, result.last]
end

def add_average_per_year(players)
  players.map do |player|
    number_of_years_played = 
      player[:years_played].last - player[:years_played].first + 1
    player[:average_per_year] = 
      player[:three_pointers_made].delete(',').to_f / number_of_years_played
    player
  end
  players
end

def sort_by_average_per_year(players)
  players.sort_by { |player| player[:average_per_year] }.reverse
end

def print_table(players)
  headings = ["Name", "Years Played", "3s made", "Avg / Year", "FG %"]
  table = Terminal::Table.new headings: headings do |t|
    players.each do |player|
      t.add_row [ 
        player[:name], 
        player[:years_played].join(' - '),
        player[:three_pointers_made],
        player[:average_per_year].round(2),
        player[:field_goal_percentage]
      ]  
    end
  end

  2.upto(4) { |col| table.align_column(col, :right) }

  puts table
end

NUMBER_OF_PLAYERS = 10
players = fetch_players
players = add_average_per_year(players)
players = sort_by_average_per_year(players).first(NUMBER_OF_PLAYERS)
print_table(players)
