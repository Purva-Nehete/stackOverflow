import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";
import { reputationRules } from "../config/reputationRules.js";
import { recordReputationChange } from "../services/reputationLedger.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { answerbody } = req.body || {};
  if (typeof answerbody !== "string" || !answerbody.trim()) {
    return res.status(400).json({ message: "Answer body is required." });
  }

  try {
    const author = await user.findById(req.userid).select("name");
    if (!author) return res.status(404).json({ message: "User unavailable" });
    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $push: {
          answer: {
            answerbody: answerbody.trim(),
            useranswered: author.name,
            userid: String(req.userid),
          },
        },
        $inc: { noofanswer: 1 },
      },
      { new: true }
    );
    if (!updatequestion) {
      return res.status(404).json({ message: "question unavailable" });
    }

    const createdAnswer = updatequestion.answer[updatequestion.answer.length - 1];
    await recordReputationChange({
      userId: req.userid,
      amount: reputationRules.rewards.answerPosted,
      eventType: reputationRules.eventTypes.answerPosted,
      eventKey: `answer:${createdAnswer._id}:posted`,
      relatedContentId: createdAnswer._id,
    });
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.error("Askanswer error:", error);
    res.status(500).json({ message: "Unable to post answer." });
    return;
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) return res.status(404).json({ message: "question unavailable" });
    const answer = questionDoc.answer.id(answerid);
    if (!answer) return res.status(404).json({ message: "answer unavailable" });
    if (String(answer.userid) !== String(req.userid)) {
      return res.status(403).json({ message: "You can only delete your own answer." });
    }

    answer.deleteOne();
    questionDoc.noofanswer = Math.max(0, questionDoc.noofanswer - 1);
    await questionDoc.save();
    await recordReputationChange({
      userId: req.userid,
      amount: -reputationRules.penalties.userDeletedAnswer,
      eventType: reputationRules.eventTypes.userDeletedAnswer,
      eventKey: `answer:${answerid}:deleted_by_user`,
      relatedContentId: answerid,
    });
    const updatequestion = { acknowledged: true, modifiedCount: 1 };
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.error("deleteanswer error:", error);
    res.status(500).json({ message: "Unable to delete answer." });
    return;
  }
};

export const voteanswer = async (req, res) => {
  const { questionId, answerId } = req.params;
  const { value } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Question or answer unavailable." });
  }
  if (!["upvote", "downvote"].includes(value)) {
    return res.status(400).json({ message: "Invalid vote." });
  }

  try {
    const questionDoc = await question.findById(questionId);
    const answer = questionDoc?.answer.id(answerId);
    if (!answer) return res.status(404).json({ message: "Answer unavailable." });
    if (String(answer.userid) === String(req.userid)) {
      return res.status(400).json({ message: "You cannot vote on your own answer." });
    }

    const voterId = String(req.userid);
    const wasDownvoted = answer.downvote.includes(voterId);
    const wasUpvoted = answer.upvote.includes(voterId);
    if (value === "upvote") {
      answer.downvote = answer.downvote.filter((id) => id !== voterId);
      answer.upvote = wasUpvoted
        ? answer.upvote.filter((id) => id !== voterId)
        : [...answer.upvote, voterId];
    } else {
      answer.upvote = answer.upvote.filter((id) => id !== voterId);
      answer.downvote = wasDownvoted
        ? answer.downvote.filter((id) => id !== voterId)
        : [...answer.downvote, voterId];
    }
    await questionDoc.save();

    if (value === "downvote" && !wasDownvoted) {
      await recordReputationChange({
        userId: answer.userid,
        amount: -reputationRules.penalties.receivedDownvote,
        eventType: reputationRules.eventTypes.receivedDownvote,
        eventKey: `answer:${answerId}:downvote:${voterId}`,
        relatedContentId: answerId,
        actorId: req.userid,
      });
    }
    if (value === "upvote" && answer.upvote.length >= reputationRules.thresholds.answerUpvotes) {
      await recordReputationChange({
        userId: answer.userid,
        amount: reputationRules.rewards.answerReachesFiveUpvotes,
        eventType: reputationRules.eventTypes.answerReachesFiveUpvotes,
        eventKey: `answer:${answerId}:upvotes:${reputationRules.thresholds.answerUpvotes}`,
        relatedContentId: answerId,
      });
    }

    return res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.error("voteanswer error:", error);
    return res.status(500).json({ message: "Unable to vote on answer." });
  }
};

export const acceptAnswer = async (req, res) => {
  const { questionId, answerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Question or answer unavailable." });
  }

  try {
    const questionDoc = await question.findById(questionId);
    if (!questionDoc) return res.status(404).json({ message: "Question unavailable." });
    if (String(questionDoc.userid) !== String(req.userid)) {
      return res.status(403).json({ message: "Only the question author can accept an answer." });
    }
    const answer = questionDoc.answer.id(answerId);
    if (!answer) return res.status(404).json({ message: "Answer unavailable." });
    if (questionDoc.acceptedAnswerId) {
      return res.status(409).json({ message: "This question already has an accepted answer." });
    }

    answer.isAccepted = true;
    questionDoc.acceptedAnswerId = answer._id;
    await questionDoc.save();
    await recordReputationChange({
      userId: answer.userid,
      amount: reputationRules.rewards.acceptedAnswer,
      eventType: reputationRules.eventTypes.acceptedAnswer,
      eventKey: `answer:${answerId}:accepted`,
      relatedContentId: answerId,
      actorId: req.userid,
    });
    return res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.error("acceptAnswer error:", error);
    return res.status(500).json({ message: "Unable to accept answer." });
  }
};
