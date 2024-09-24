import logger from "../functions/logger";

export default (req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    date: new Date(),
    message: "Request received",
  });
  next();
};
