import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerOutput from "./swagger-output.json";

export default (app: Express) => {
  const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css";

  const options = {
    explorer: true,
    customSiteTitle: "Mobile POS Inventory API",
    customCssUrl: CSS_URL,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .scheme-container { background: #fff; box-shadow: none; }
    `,
    swaggerOptions: {
      spec: swaggerOutput,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      docExpansion: "list",
      filter: true,
      showRequestHeaders: true,
    },
  };

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput, options));

  // JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(swaggerOutput);
  });
};
