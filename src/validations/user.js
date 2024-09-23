import Joi from "joi";

const createUserValidation = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .required()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=]).{8,}$")
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character, and be at least 8 characters long.",
      }),
  }),
  //   query: Joi.object({
  //     action: Joi.string().valid("accept", "reject").required(),
  //   }).required(),
});

export { createUserValidation };
