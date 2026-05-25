import { Express } from "express";
import swaggerOutput from "./swagger-output.json";

const CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14";

export default (app: Express) => {
  // Serve Swagger UI with CDN assets (works on Vercel serverless)
  app.get("/api-docs", (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mobile POS Inventory API</title>
  <link rel="stylesheet" type="text/css" href="${CDN_BASE}/swagger-ui.min.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .scheme-container { background: #fff; box-shadow: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN_BASE}/swagger-ui-bundle.min.js"></script>
  <script src="${CDN_BASE}/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api-docs.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        filter: true,
        docExpansion: 'list',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  // JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(swaggerOutput);
  });
};
