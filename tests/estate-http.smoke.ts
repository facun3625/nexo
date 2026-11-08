import "dotenv/config";
import { request as httpRequest } from "node:http";
import assert from "node:assert/strict";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const base = "http://127.0.0.1:3010";
const host = "demo-inmo.localhost:3010";
const password = process.env.ESTATE_DEMO_PASSWORD;
if (!password)
  throw new Error("Set ESTATE_DEMO_PASSWORD to the local demo password.");
if (
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  )
)
  throw new Error("Local DB required");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const jar = new Map<string, string>();
async function request(path: string, init: RequestInit = {}) {
  const response = await new Promise<Response>((resolve, reject) => {
    const req = httpRequest(
      base + path,
      {
        method: init.method ?? "GET",
        headers: {
          host,
          cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
          ...((init.headers as Record<string, string>) ?? {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const headers = new Headers();
          for (let i = 0; i < res.rawHeaders.length; i += 2)
            headers.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode,
              headers,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    if (init.body) req.write(String(init.body));
    req.end();
  });
  for (const c of response.headers.getSetCookie()) {
    const [kv] = c.split(";");
    const split = kv.indexOf("=");
    jar.set(kv.slice(0, split), kv.slice(split + 1));
  }
  return response;
}
async function main() {
  const tenant = await db.tenant.findFirstOrThrow();
  const first = await request("/admin");
  assert([302, 307].includes(first.status));
  const csrf = await (await request("/api/auth/csrf")).json();
  await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: `http://${host}`,
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email: "admin@demo-inmo.example",
      password: password!,
      tenantId: tenant.id,
      callbackUrl: `http://${host}/admin`,
    }),
  });
  for (const path of [
    "/",
    "/admin",
    ...[
      "propiedades",
      "clientes",
      "consultas",
      "visitas",
      "operaciones",
      "tasaciones",
      "contratos",
      "cobranzas",
      "emprendimientos",
    ].map((m) => `/admin/gestion/${m}`),
  ]) {
    const response = await request(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert(!html.includes('"digest":'), `${path}: server render error`);
    assert(!html.includes("NEXT_HTTP_ERROR_FALLBACK;500"), path);
    console.log(`OK ${path}`);
  }
  for (const path of [
    "/admin/gestion/mantenimiento",
    "/admin/gestion/consorcios",
    "/admin/gestion/unidades",
  ]) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    console.log(`OK ${path} removed`);
  }
  const property = await db.estateProperty.findFirstOrThrow({
    where: { tenantId: tenant.id, published: true },
  });
  const response = await request(`/propiedades/${property.id}`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert(html.includes(property.title));
  assert(!html.includes(property.address), "Private property address leaked");
  console.log("OK property detail; private address absent");
  const unknown = await request("/propiedades/not-a-real-id");
  assert.equal(unknown.status, 404);
  console.log("OK unknown property 404");
}
main().finally(() => db.$disconnect());
