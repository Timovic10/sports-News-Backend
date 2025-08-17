// routes/matchRoutes.js
import express from "express";
import {
  getMatchesToday,
  getMatchesWeek,
  getLeagueTable,
  getLiveMatchEvents,
  getMatchDetail,
} from "../controller/matchController.js";

const router = express.Router();

router.get("/today", getMatchesToday);
router.get("/week", getMatchesWeek);
router.get("/league/:league/table", getLeagueTable);
router.get("/live/:matchId", getLiveMatchEvents);
router.get("/:matchId", getMatchDetail);

export default router;
