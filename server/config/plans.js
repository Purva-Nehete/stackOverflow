export const productRules = {
  policy: {
    downgradeAtRenewal: true,
    immediateUpgrade: true,
    cancelAtPeriodEnd: true,
    failedRenewalKeepsAccessUntilPeriodEnd: true,
    bookmarksLimitByPlan: true,
    invoiceGeneration: "provider",
  },
  currency: "INR",
  billingCycle: "monthly",
  notes: {
    free: "Basic access with a single daily question limit.",
    bronze: "Monthly renewal allows access to bronze-specific benefits.",
    silver: "Includes priority support and enhanced visibility, with unlimited bookmarks.",
    gold: "Highest priority plan with exclusive community access and unlimited question posting.",
  },
};

export const planDefinitions = {
  free: {
    name: "Free",
    price: 0,
    currency: productRules.currency,
    dailyQuestionLimit: 1,
    badge: null,
    features: {
      basicSearch: true,
      advancedSearch: false,
      prioritySupport: false,
      enhancedVisibility: false,
      unlimitedBookmarks: false,
      exclusiveCommunity: false,
    },
  },
  bronze: {
    name: "Bronze",
    price: 99,
    currency: productRules.currency,
    dailyQuestionLimit: 5,
    badge: "Bronze",
    features: {
      basicSearch: true,
      advancedSearch: true,
      prioritySupport: false,
      enhancedVisibility: false,
      unlimitedBookmarks: false,
      exclusiveCommunity: false,
    },
  },
  silver: {
    name: "Silver",
    price: 299,
    currency: productRules.currency,
    dailyQuestionLimit: 15,
    badge: "Silver",
    features: {
      basicSearch: true,
      advancedSearch: true,
      prioritySupport: true,
      enhancedVisibility: true,
      unlimitedBookmarks: true,
      exclusiveCommunity: false,
    },
  },
  gold: {
    name: "Gold",
    price: 999,
    currency: productRules.currency,
    dailyQuestionLimit: Infinity,
    badge: "Gold",
    features: {
      basicSearch: true,
      advancedSearch: true,
      prioritySupport: true,
      enhancedVisibility: true,
      unlimitedBookmarks: true,
      exclusiveCommunity: true,
    },
  },
};

export const getPlanByKey = (planKey) => {
  return planDefinitions[planKey] || planDefinitions.free;
};

export const getPlanList = () => {
  return Object.entries(planDefinitions).map(([key, value]) => ({
    key,
    ...value,
  }));
};
