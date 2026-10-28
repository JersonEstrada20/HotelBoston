import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const adminDir = path.join(root, "dist", "admin");
const indexFile = path.join(adminDir, "index.html");

const routes = [
  "login",
  "forgot-password",
  "reset-password",
  "solicitudes",
  "ocupacion",
  "registro",
  "ingresos",
  "habitaciones",
  "opiniones",
  "integraciones",
  "ajustes",
  "accesos",
  "historial",
  "cuenta",
];

for (const route of routes) {
  const targetDir = path.join(adminDir, route);
  await mkdir(targetDir, { recursive: true });
  await copyFile(indexFile, path.join(targetDir, "index.html"));
}
