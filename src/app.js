import express from "express";
import cors from "cors";
import bodyParser from "bodyParser";
import mongoSanitize from "mongoSanitize";
import swaggerUi from "swaggerUi";
import router from "./router";
import ApiError from "./utils/ApiError";
import loggerMiddleware from "./middleware/loggerMiddleware";
import swaggerFile from "../swagger_output.json"; // Generated Swagger file
import handleInvalidRoute from "./middleware/invalidRoute";
import cookieParser from "cookie-parser";
import xss from "xss-clean";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(loggerMiddleware);

// Apply mongoSanitize middleware
app.use(xss());
app.use(mongoSanitize());
app.use(
  mongoSanitize({
    replaceWith: "",
  })
);

// router index
app.use("/api", router);

// api doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", (req, res) => {
  res.send("Boilerplate-BE");
});

app.use(handleInvalidRoute);
// send back a 404 error for any unknown api request
app.use((_, _, next) => {
  next(new ApiError(404, "Not found"));
});

export default app;
