import express from "express";
import { getFeed } from "../controller/post.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", optionalAuth, getFeed);
router.get("/following", optionalAuth, (req, res, next) => {
  req.query.feed = "following";
  return getFeed(req, res, next);
});
router.get("/trending", optionalAuth, (req, res, next) => {
  req.query.sort = "trending";
  return getFeed(req, res, next);
});
router.get("/users/:id/posts", optionalAuth, (req, res, next) => {
  req.query.authorId = req.params.id;
  return getFeed(req, res, next);
});
router.get("/hashtags/:tag/posts", optionalAuth, (req, res, next) => {
  req.query.tag = req.params.tag;
  return getFeed(req, res, next);
});

export default router;
