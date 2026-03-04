/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function hasGeneratedPrismaClient() {
  try {
    const prismaClientPackage = require.resolve("@prisma/client/package.json");
    const prismaClientDir = path.dirname(prismaClientPackage);
    require.resolve(".prisma/client/index-browser", { paths: [prismaClientDir] });
    return true;
  } catch {
    return false;
  }
}

if (hasGeneratedPrismaClient()) {
  process.exit(0);
}

function runPrismaGenerate() {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && npmExecPath.toLowerCase().includes("pnpm")) {
    return spawnSync(process.execPath, [npmExecPath, "prisma", "generate"], {
      stdio: "inherit",
    });
  }

  return spawnSync("pnpm", ["prisma", "generate"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

const result = runPrismaGenerate();

if (result.status !== 0) {
  if (result.error) {
    console.error(result.error.message);
  }
  process.exit(result.status ?? 1);
}
