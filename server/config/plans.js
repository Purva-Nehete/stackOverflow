export const planDefinitions = {
  free: {
    name: "Free",
    price: 0,
    currency: "INR",
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
    currency: "INR",
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
    currency: "INR",
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
    currency: "INR",
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
