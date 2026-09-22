const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60, message = "Too many requests. Please try again later." } = {}) =>
  (req, res, next) => {
    const identity = req.userid ? `user:${req.userid}` : `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const key = `${req.baseUrl || "global"}:${identity}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.ceil((windowMs - (now - current.startedAt)) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ message, retryAfter });
    }

    current.count += 1;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    return next();
  };

export default rateLimit;
