import mongoose from "mongoose";
import question from "../models/question.js";
import Subscription from "../models/subscription.js";
import { getPlanByKey } from "../config/plans.js";
import { reputationRules } from "../config/reputationRules.js";
import { recordReputationChange } from "../services/reputationLedger.js";

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;

  try {
    const subscription = await Subscription.findOne({
      userId: req.userid,
      status: "active",
    }).sort({ createdAt: -1 });
    const subscriptionIsCurrent =
      subscription?.currentPeriodEnd && subscription.currentPeriodEnd > new Date();
    const planKey = subscriptionIsCurrent ? subscription.plan : "free";
    const plan = getPlanByKey(planKey);
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const questionsUsed = await question.countDocuments({
      userid: String(req.userid),
      askedon: { $gte: startOfToday },
    });

    if (Number.isFinite(plan.dailyQuestionLimit) && questionsUsed >= plan.dailyQuestionLimit) {
      return res.status(429).json({
        message: "Daily question limit reached",
        plan: planKey,
        limit: plan.dailyQuestionLimit,
        used: questionsUsed,
      });
    }

    const postques = new question({
      ...postquestiondata,
      userid: String(req.userid),
    });
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const {
      query,
      tag,
      sort = "recent",
      dateFrom,
      dateTo,
      answered,
      userId,
    } = req.query;
    const tags = Array.isArray(tag)
      ? tag.flatMap((value) => value.split(","))
      : tag
        ? tag.split(",")
        : [];
    const advancedSearchRequested =
      tags.length > 1 || dateFrom || dateTo || answered !== undefined || userId || sort === "popular";

    if (advancedSearchRequested) {
      const subscription = req.userid
        ? await Subscription.findOne({ userId: req.userid, status: "active" }).sort({
            createdAt: -1,
          })
        : null;
      const subscriptionIsCurrent =
        subscription?.currentPeriodEnd && subscription.currentPeriodEnd > new Date();
      const planKey = subscriptionIsCurrent ? subscription.plan : "free";

      if (!getPlanByKey(planKey).features.advancedSearch) {
        return res.status(403).json({
          message: "Advanced search requires a premium plan",
          feature: "advancedSearch",
          plan: planKey,
        });
      }
    }

    if (!['recent', 'popular'].includes(sort)) {
      return res.status(400).json({ message: "Invalid sort option" });
    }

    const filters = {};

    if (query) {
      filters.$or = [
        { questiontitle: { $regex: query, $options: "i" } },
        { questionbody: { $regex: query, $options: "i" } },
      ];
    }

    if (tags.length) {
      filters.questiontags = { $all: tags.map((value) => value.trim()).filter(Boolean) };
    }

    if (dateFrom || dateTo) {
      filters.askedon = {};
      if (dateFrom) filters.askedon.$gte = new Date(dateFrom);
      if (dateTo) filters.askedon.$lte = new Date(dateTo);
    }

    if (answered !== undefined) {
      if (!["true", "false"].includes(answered)) {
        return res.status(400).json({ message: "answered must be true or false" });
      }
      filters.noofanswer = answered === "true" ? { $gt: 0 } : 0;
    }

    if (userId) {
      filters.userid = userId;
    }

    const sortOrder = sort === "popular" ? { upvote: -1, askedon: -1 } : { askedon: -1 };
    const allquestion = await question.find(filters).sort(sortOrder);
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json({ message: "Unable to search questions" });
    return;
  }
};
export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) return res.status(404).json({ message: "question unavailable" });
    const voterId = String(req.userid);
    if (String(questionDoc.userid) === voterId) {
      return res.status(400).json({ message: "You cannot vote on your own question." });
    }
    const upindex = questionDoc.upvote.findIndex((id) => id === voterId);
    const downindex = questionDoc.downvote.findIndex(
      (id) => id === voterId
    );
    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== voterId);
      }
      if (upindex === -1) {
        questionDoc.upvote.push(voterId);
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== voterId);
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== voterId);
      }
      if (downindex === -1) {
        questionDoc.downvote.push(voterId);
      } else {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== voterId);
      }
    } else {
      return res.status(400).json({ message: "Invalid vote." });
    }
    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
    if (value === "downvote" && downindex === -1) {
      await recordReputationChange({
        userId: questionDoc.userid,
        amount: -reputationRules.penalties.receivedDownvote,
        eventType: reputationRules.eventTypes.receivedDownvote,
        eventKey: `question:${_id}:downvote:${voterId}`,
        relatedContentId: _id,
        actorId: req.userid,
      });
    }
    if (value === "upvote" && questionDoc.upvote.length >= reputationRules.thresholds.questionUpvotes) {
      await recordReputationChange({
        userId: questionDoc.userid,
        amount: reputationRules.rewards.questionReachesTenUpvotes,
        eventType: reputationRules.eventTypes.questionReachesTenUpvotes,
        eventKey: `question:${_id}:upvotes:${reputationRules.thresholds.questionUpvotes}`,
        relatedContentId: _id,
      });
    }
    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
