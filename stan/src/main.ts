import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// TODO: replace with kowainik one
const TOOL_REPO = "https://github.com/mbg/stan/releases/download";
const TOOL_TAG = "test";
const TOOL_NAME = "Stan";
const TOOL_VERSION = "0.0.1.0";

async function getExistingStanPath(): Promise<string> {
  return tc.find(TOOL_NAME, TOOL_VERSION);
}

async function downloadStan(): Promise<string> {
  const archivePath = await tc.downloadTool(
    `${TOOL_REPO}/${TOOL_TAG}/stan-Linux.tar.gz`
  );
  core.info(`Stan downloaded to ${archivePath}`);
  const extractedFolder = await tc.extractTar(archivePath, os.homedir());
  const releaseFolder = path.join(extractedFolder, "stan-0.0.1");
  core.info(`Release folder is ${releaseFolder}`);
  const cachedPath = await tc.cacheDir(releaseFolder, TOOL_NAME, TOOL_VERSION);
  core.info(`Stan cached to ${cachedPath}`);
  return cachedPath;
}

async function findOrDownloadStan(): Promise<string> {
  const existingPath = await getExistingStanPath();
  if (existingPath) {
    core.info(`Found Stan at ${existingPath}`);
    return existingPath;
  } else {
    core.info("Stan not cached, downloading...");
    return core.group("Downloading Stan", async () => await downloadStan());
  }
}

const INPUT_KEY_STAN_WORKING_DIRECTORY = "working-directory";
const INPUT_KEY_STAN_OUTPUT_DIRECTORY = "output-directory";
const INPUT_KEY_STAN_SARIF = "sarif";

interface RunResult {
  exitCode: number;
  stdout: string;
}

async function runStan(binary: string): Promise<RunResult> {
  const buffers: Buffer[] = [];
  const inputWD =
    core.getInput(INPUT_KEY_STAN_WORKING_DIRECTORY, {required: false}) || ".";
  const sarif = core.getBooleanInput(INPUT_KEY_STAN_SARIF, {required: false});
  const stanArgs: string[] = [sarif ? "--sarif" : "--json"];
  core.info(`Running ${binary} ${stanArgs.join(" ")}`);
  const exitCode = await exec.exec(binary, stanArgs, {
    cwd: inputWD,
    listeners: {
      stdout: chunk => buffers.push(chunk)
    }
  });
  const stdout = Buffer.concat(buffers).toString("utf8");
  return {exitCode, stdout};
}

async function run(): Promise<void> {
  try {
    const stanPath = await findOrDownloadStan();
    const {exitCode, stdout} = await runStan(path.join(stanPath, "stan"));
    const outputDir =
      core.getInput(INPUT_KEY_STAN_OUTPUT_DIRECTORY, {required: false}) || ".";
    fs.writeFile(path.join(outputDir, "stan.sarif"), stdout, err => {
      throw err;
    });
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
  }
}

run();
