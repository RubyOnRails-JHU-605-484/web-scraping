// npm install node-fetch cheerio cli-table
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Table = require('cli-table');

const addAveragePerYear = players => {
  return players.map(player => {
    const { yearsPlayed, threePointersMade } = player;
    const numberOfYearsPlayed =
      parseInt(yearsPlayed[1]) - parseInt(yearsPlayed[0]) + 1;
    player['averagePerYear'] = (
      parseFloat(threePointersMade.replace(',', '')) / numberOfYearsPlayed
    ).toFixed(2);

    return player;
  });
};

const sortByAveragePerYear = players =>
  players.sort(
    (player1, player2) => player2.averagePerYear - player1.averagePerYear
  );

const compactBeginEndYears = yearsStr => {
  let result = yearsStr.replace(/present/g, new Date().getFullYear());
  result = result.match(/\(\d.*?\d\)/g);

  result = result.map(eachPair => {
    eachPair = eachPair.replace(/\(|\)/g, '');
    eachPair = eachPair.replace(/\u2013/g, ',');
    eachPair = eachPair.split(',').map(str => parseInt(str));
    return eachPair;
  });

  const flattenedSortedArray = [].concat(...result).sort();

  return [
    flattenedSortedArray[0],
    flattenedSortedArray[flattenedSortedArray.length - 1]
  ];
};

const fetchPlayers = async () => {
  let players = [];
  const response = await fetch(
    'https://en.wikipedia.org/wiki/List_of_National_Basketball_Association_career_3-point_scoring_leaders'
  );
  const page = await response.text();
  const $ = cheerio.load(page);
  const tableRows = $('table.wikitable.sortable tr');

  tableRows.each((i, elem) => {
    const tds = $(elem).find('td');
    if (tds.length > 0) {
      players.push({
        name: $(tds[1])
          .text()
          .trim(),
        yearsPlayed: compactBeginEndYears(
          $(tds[3])
            .text()
            .trim()
        ),
        threePointersMade: $(tds[4])
          .text()
          .trim(),
        fieldGoalPercentage: $(tds[6])
          .text()
          .trim()
      });
    }
  });

  return players;
};

const printTable = players => {
  const t = new Table({
    head: [
      'Name',
      'Years Played'.padStart(13),
      '3s made'.padStart(10),
      'Avg / Year',
      'FG %'
    ]
  });

  players.forEach(player => {
    const {
      name,
      yearsPlayed,
      fieldGoalPercentage,
      threePointersMade,
      averagePerYear
    } = player;

    t.push([
      name.padEnd(20),
      yearsPlayed.join(' - ').padStart(13),
      threePointersMade.padStart(10),
      averagePerYear.padStart(10),
      fieldGoalPercentage
    ]);
  });

  console.log(t.toString());
};

const TOP_NUMBER_OF_PLAYERS = 10;

async function main() {
  let players = await fetchPlayers();
  players = addAveragePerYear(players);
  sortByAveragePerYear(players);
  printTable(players.slice(0, TOP_NUMBER_OF_PLAYERS));
}

main();
