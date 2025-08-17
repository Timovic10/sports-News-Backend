// models/Match.js
export default class Match {
  constructor({ id, competition, homeTeam, awayTeam, utcDate, status, score }) {
    this.matchId = id;
    this.league = competition.name;
    this.homeTeam = homeTeam.name;
    this.awayTeam = awayTeam.name;
    this.date = utcDate;
    this.status = status;
    this.score = {
      home: score.fullTime.home ?? 0,
      away: score.fullTime.away ?? 0,
    };
  }
}
