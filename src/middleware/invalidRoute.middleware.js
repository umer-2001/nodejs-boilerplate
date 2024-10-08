import ErrorHandler from "../utils/ErrorHandler";
const handleInvalidRoute = (req, res) => {
  return ErrorHandler(
    `The Requested Route ${req.hostname + req.originalUrl} Not Found`,
    404,
    req,
    res
  );
};
export default handleInvalidRoute;
