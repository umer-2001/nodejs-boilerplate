const SuccessHandler = (data, statusCode, res) => {
  return res.status(statusCode).json({
    success: true,
    data: data,
  });
};

export default SuccessHandler;
