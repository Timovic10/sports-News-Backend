// controllers/matchController.js
import axios from "axios";
import fetch from "node-fetch";
import Match from "../models/match.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const API_KEY = process.env.FOOTBALL_DATA_KEY;
const API_URL = "https://api.football-data.org/v4/matches";

// List of Europe’s top competitions
const TOP_LEAGUES = ["PL", "PD", "SA", "BL1", "FL1", "CL"];

export const getMatchesToday = catchAsync(async (req, res, next) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (!API_KEY) {
    return next(new AppError("API key for football data is not set", 500));
  }

  let allMatches = [];

  // Fetch matches for each top league
  for (const league of TOP_LEAGUES) {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${league}/matches?dateFrom=${today}&dateTo=${today}`,
      { headers: { "X-Auth-Token": API_KEY } }
    );

    const data = await response.json();

    if (data.matches) {
      allMatches = [...allMatches, ...data.matches.map((m) => new Match(m))];
    }
  }

  res.json(allMatches);
});

export const getMatchesWeek = catchAsync(async (req, res, next) => {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const from = now.toISOString().split("T")[0];
  const to = nextWeek.toISOString().split("T")[0];

  if (!API_KEY) {
    return next(new AppError("API key for football data is not set", 500));
  }

  let allMatches = [];

  for (const league of TOP_LEAGUES) {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${league}/matches?dateFrom=${from}&dateTo=${to}`,
      { headers: { "X-Auth-Token": API_KEY } }
    );

    const data = await response.json();

    if (data.matches) {
      allMatches = [...allMatches, ...data.matches.map((m) => new Match(m))];
    }
  }

  res.json(allMatches);
});

export const getLeagueTable = catchAsync(async (req, res, next) => {
  const { league } = req.params; // e.g. PL, PD, SA, BL1, FL1

  if (!API_KEY) {
    return next(new AppError("API key for football data is not set", 500));
  }

  const response = await fetch(
    `https://api.football-data.org/v4/competitions/${league}/standings`,
    {
      headers: { "X-Auth-Token": API_KEY },
    }
  );

  const data = await response.json();

  if (!data.standings) {
    return next(new AppError("No standings data found", 404));
  }

  const table = data.standings[0].table.map((t) => ({
    position: t.position,
    team: t.team.name,
    playedGames: t.playedGames,
    won: t.won,
    draw: t.draw,
    lost: t.lost,
    goalsFor: t.goalsFor,
    goalsAgainst: t.goalsAgainst,
    goalDifference: t.goalDifference,
    points: t.points,
  }));

  res.json(table);
});

// live match events (goals, scorers, etc.)
export const getLiveMatchEvents = catchAsync(async (req, res, next) => {
  if (!API_KEY) {
    return next(new AppError("API key for football data is not set", 500));
  }
  if (!req.params.matchId) {
    return next(new AppError("Match ID is required", 400));
  }

  const { matchId } = req.params;

  const response = await axios.get(
    `https://api.football-data.org/v4/matches/${matchId}`,
    {
      headers: { "X-Auth-Token": API_KEY },
    }
  );

  const match = response.data.match;

  if (!match) {
    return next(new AppError("Match not found", 404));
  }

  // Extract teams and scores
  const homeTeam = match.homeTeam?.name;
  const awayTeam = match.awayTeam?.name;
  const score = `${match.score.fullTime.home ?? 0} - ${
    match.score.fullTime.away ?? 0
  }`;

  // Extract goal scorers if available
  const goals =
    match.goals?.map((goal) => ({
      minute: goal.minute,
      scorer: goal.scorer?.name,
      assist: goal.assist?.name || null,
      team: goal.team?.name,
    })) || [];

  res.json({
    matchId,
    status: match.status, // e.g. "IN_PLAY", "PAUSED", "FINISHED"
    homeTeam,
    awayTeam,
    score,
    goals,
  });
});

// Get single match details (with lineup if provided by API)

export const getMatchDetail = catchAsync(async (req, res, next) => {
  const { matchId } = req.params;
  if (!matchId) {
    return next(new AppError("Match ID is required", 400));
  }
  if (!API_KEY) {
    return next(new AppError("API key for football data is not set", 500));
  }
  const response = await axios.get(`${API_URL}/${matchId}`, {
    headers: {
      "X-Auth-Token": API_KEY,
    },
  });
  const data = response.data;

  if (!data) {
    return next(new AppError("Match not found", 404));
  }

  // Extract referee info if available
  const referees = (data.referees || []).map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role, // e.g., REFEREE, ASSISTANT_REFEREE
  }));

  const matchDetail = {
    id: data.id,
    competition: data.competition.name,
    season: `${data.season.startDate} - ${data.season.endDate}`,
    status: data.status,
    utcDate: data.utcDate,
    homeTeam: data.homeTeam.name,
    awayTeam: data.awayTeam.name,
    score: {
      home: data.score.fullTime.home ?? 0,
      away: data.score.fullTime.away ?? 0,
    },
    referees,
    lineups: data.lineups || [], // Include lineups if available
  };
  res.status(200).json({
    status: "success",
    data: matchDetail,
  });
});
