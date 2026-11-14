import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import communityApi from "./community-api.js";

const app = express();
const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverRoot, "..");
const buildDirectory = path.join(projectRoot, "dist");
const port = Number(process.env.PORT) || 3001;

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use("/api", communityApi);
app.use(express.static(buildDirectory));
app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ ok: false, message: "Solicitud inválida." });
    return;
  }
  console.error("[server]", error);
  response.status(500).json({ ok: false, message: "Ocurrió un error en el servidor." });
});

app.listen(port, () => {
  console.log(`Team Chapingo disponible en http://localhost:${port}`);
});
