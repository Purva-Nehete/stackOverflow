const freezeRecord = (record) => Object.freeze(record);

export const reputationRules = freezeRecord({
  rewards: freezeRecord({
    answerPosted: 5,
    acceptedAnswer: 10,
    answerReachesFiveUpvotes: 5,
    questionReachesTenUpvotes: 2,
    completedProfile: 10,
  }),
  penalties: freezeRecord({
    receivedDownvote: 2,
    userDeletedAnswer: 5,
    administratorRemovedContent: 10,
  }),
  thresholds: freezeRecord({
    answerUpvotes: 5,
    questionUpvotes: 10,
  }),
  privileges: freezeRecord({
    unrestrictedCommenting: 50,
    editCommunityPosts: 100,
    voteToCloseQuestions: 250,
    reportInappropriateContent: 500,
  }),
  transfers: freezeRecord({
    minimumReputationExclusive: 50,
    maximumPerTransaction: 50,
    maximumPerUtcDay: 100,
    minimumAmount: 1,
    reasonMaximumLength: 500,
  }),
  balance: freezeRecord({
    minimum: 0,
  }),
  policy: freezeRecord({
    thresholdRewardsAreOneTime: true,
    profileRewardIsOneTime: true,
    downvotePenaltyIsPerDistinctVote: true,
    voteRemovalReversesPenalty: false,
    dailyTransferWindow: "UTC calendar day",
    eventIdempotency: "Each reputation event must have a unique server-generated event key.",
  }),
  eventTypes: freezeRecord({
    answerPosted: "answer_posted",
    acceptedAnswer: "accepted_answer",
    answerReachesFiveUpvotes: "answer_reaches_five_upvotes",
    questionReachesTenUpvotes: "question_reaches_ten_upvotes",
    completedProfile: "completed_profile",
    receivedDownvote: "received_downvote",
    userDeletedAnswer: "user_deleted_answer",
    administratorRemovedContent: "administrator_removed_content",
    reputationTransferSent: "reputation_transfer_sent",
    reputationTransferReceived: "reputation_transfer_received",
  }),
});

export const getReputationRules = () => reputationRules;

export const getPrivilegeAvailability = (reputation) => {
  const currentReputation = Number.isFinite(reputation) ? reputation : 0;

  return {
    unrestrictedCommenting:
      currentReputation >= reputationRules.privileges.unrestrictedCommenting,
    editCommunityPosts:
      currentReputation >= reputationRules.privileges.editCommunityPosts,
    voteToCloseQuestions:
      currentReputation >= reputationRules.privileges.voteToCloseQuestions,
    reportInappropriateContent:
      currentReputation >= reputationRules.privileges.reportInappropriateContent,
  };
};
