const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName
    FROM
        player_details
    ORDER BY
        player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName
    FROM
        player_details
    WHERE
        player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetailsQuery = `
  UPDATE
    player_details
  SET
    player_name='${playerName}'
  WHERE
    player_id = ${playerId};`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
        match_id AS matchId,
        match,
        year
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersMatches = `
    SELECT
        match_details.match_id AS matchId,
        match_details.match,
        match_details.year
    FROM
        player_match_score INNER JOIN
        match_details
        ON player_match_score.match_id = match_details.match_id
    WHERE
        player_match_score.player_id = ${playerId};`;
  const playersMatchesArray = await db.all(getPlayersMatches);
  response.send(playersMatchesArray);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersOfMatchQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName
    FROM
        player_match_score INNER JOIN
        player_details ON player_match_score.player_id = player_details.player_id
    WHERE
        player_match_score.match_id = ${matchId};`;
  const playersArrayOfMatch = await db.all(getAllPlayersOfMatchQuery);
  response.send(playersArrayOfMatch);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM
        player_match_score INNER JOIN
        player_details ON player_match_score.player_id = player_details.player_id
    WHERE
        player_details.player_id = ${playerId};`;
  const playerScores = await db.get(getPlayerScoresQuery);
  response.send(playerScores);
});

module.exports = app;
