import { spawn } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

export const BACKUPS_DIR = path.join(process.cwd(), "data", "backups");
export const MAX_BACKUPS = 5;

const FILENAME_PATTERN = /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.dump$/;

export type BackupFileInfo = { filename: string; sizeBytes: number; createdAt: Date };
export type BackupResult = BackupFileInfo & { durationMs: number; deletedFilenames: string[] };

// PM2 corre esta app en una sola instancia (sin cluster) — alcanza una
// bandera de módulo, no hace falta un lock de archivo entre procesos.
let backupInProgress = false;

export async function createDatabaseBackup(): Promise<BackupResult> {
  if (backupInProgress) throw new Error("Ya hay un backup en curso");
  backupInProgress = true;
  const startedAt = Date.now();

  try {
    await mkdir(BACKUPS_DIR, { recursive: true });

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`;
    const outputPath = path.join(BACKUPS_DIR, filename);
    const conn = parseDatabaseUrl(requireDatabaseUrl());

    try {
      await runPgDump(outputPath, conn);
    } catch (error) {
      await unlink(outputPath).catch(() => {});
      throw error;
    }

    const info = await stat(outputPath);
    const deletedFilenames = await enforceRetention();

    return {
      filename,
      sizeBytes: info.size,
      createdAt: info.mtime,
      durationMs: Date.now() - startedAt,
      deletedFilenames,
    };
  } finally {
    backupInProgress = false;
  }
}

export async function listBackups(): Promise<BackupFileInfo[]> {
  let filenames: string[];
  try {
    filenames = await readdir(BACKUPS_DIR);
  } catch {
    return [];
  }

  const backups = await Promise.all(
    filenames
      .filter((f) => FILENAME_PATTERN.test(f))
      .map(async (filename) => {
        const info = await stat(path.join(BACKUPS_DIR, filename));
        return { filename, sizeBytes: info.size, createdAt: info.mtime };
      }),
  );

  return backups.sort((a, b) => b.filename.localeCompare(a.filename));
}

// Para la ruta de descarga: valida el nombre contra el patrón exacto antes
// de nada (ya bloquea "..") y además arma el path con el mismo guard contra
// path traversal que ya usa api/uploads/[...path]/route.ts.
export function resolveBackupFilePath(filename: string): string | null {
  if (!FILENAME_PATTERN.test(filename)) return null;
  const filePath = path.resolve(BACKUPS_DIR, filename);
  if (filePath !== BACKUPS_DIR && !filePath.startsWith(BACKUPS_DIR + path.sep)) return null;
  return filePath;
}

async function enforceRetention(): Promise<string[]> {
  const filenames = (await readdir(BACKUPS_DIR)).filter((f) => FILENAME_PATTERN.test(f));
  // El nombre es un timestamp ISO, así que el orden alfabético ya es
  // cronológico — no hace falta un stat extra por archivo para ordenar.
  const sorted = filenames.sort().reverse();
  const toDelete = sorted.slice(MAX_BACKUPS);
  await Promise.all(toDelete.map((f) => unlink(path.join(BACKUPS_DIR, f))));
  return toDelete;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  return url;
}

type ParsedConnection = { host: string; port: string; user: string; password: string; database: string };

function parseDatabaseUrl(raw: string): ParsedConnection {
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: url.port || "5432",
    // URL.username/password/pathname vienen percent-encoded — sin decodeURIComponent
    // una contraseña con caracteres especiales rompe la conexión en silencio.
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
  };
}

function runPgDump(outputPath: string, conn: ParsedConnection): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pg_dump",
      [
        "-h", conn.host,
        "-p", conn.port,
        "-U", conn.user,
        "-d", conn.database,
        "-Fc", // formato custom: comprime solo, sin agregar ninguna dependencia de npm
        "--no-owner", // el usuario de la base difiere entre entornos (local "pedidos" vs prod "urbi_user")
        "--no-acl", // mismo motivo — evita GRANT/REVOKE atados a roles que pueden no existir al restaurar
        "-f", outputPath,
      ],
      // PGPASSWORD va por env, nunca por argv: un argv con la contraseña
      // queda visible para cualquiera que corra `ps aux` en el servidor.
      { env: { ...process.env, PGPASSWORD: conn.password } },
    );

    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("pg_dump no está instalado en este servidor"));
        return;
      }
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump terminó con código ${code}: ${stderr.trim()}`));
    });
  });
}
