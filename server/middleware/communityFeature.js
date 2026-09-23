const communityFeature = (req, res, next) => {
  if (process.env.COMMUNITY_FEED_ENABLED === "false") {
    return res.status(404).json({ message: "Community feed is currently unavailable." });
  }

  return next();
};

export default communityFeature;
