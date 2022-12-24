import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as os from 'os'

const TOOL_NAME = 'Stan';
const TOOL_VERSION = '0.0.1.0';

async function getExistingStanPath(): Promise<string> {
  return tc.find(TOOL_NAME, TOOL_VERSION);
}

async function downloadStan(): Promise<string> {
  const archivePath = await tc.downloadTool('https://github.com/mbg/stan/releases/download/test/stan-Linux.tar.gz');
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
  if(existingPath) {
    core.info(`Found Stan at ${existingPath}`);
    return existingPath;
  } else {
    core.info('Stan not cached, downloading...');
    return core.group('Downloading Stan', async () => await downloadStan())
  }
}

const INPUT_KEY_STAN_WORKING_DIRECTORY = "working-directory";

async function runStan(binary: string): Promise<number> {
  const inputWD = core.getInput(INPUT_KEY_STAN_WORKING_DIRECTORY, {required: false}) || ".";
  const stanArgs: string[] = [];
  core.info(`Running ${binary} ${stanArgs.join(' ')}`);
  const statusCode = exec.exec(binary, stanArgs, {
    cwd: inputWD
  });
  return statusCode;
}

async function run(): Promise<void> {
  try {
    const stanPath = await findOrDownloadStan();
    await runStan(path.join(stanPath, "stan"));
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
  }
}

run()
