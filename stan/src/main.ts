import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as path from 'path'

async function getExistingStanPath(): Promise<string> {
  return tc.find('Stan', '0.0.1.0');
}

async function downloadStan(): Promise<string> {
  const binaryPath = await tc.downloadTool('https://github.com/mbg/stan/releases/download/test/stan-Linux');
  core.info(`Stan downloaded to ${binaryPath}`)
  // const cachedDir = await tc.cacheDir(path.dirname(binaryPath), "Stan", '0.0.1.0');
  return binaryPath;
}

async function findOrDownloadStan(): Promise<string> {
  const existingPath = await getExistingStanPath();
  if(existingPath) {
    core.debug(`Found Stan at ${existingPath}`);
    return existingPath;
  } else {
    core.debug('Stan not cached, downloading...');
    return core.group('Downloading Stan', async () => await downloadStan())
  }
}

async function run(): Promise<void> {
  try {
    const stanPath = await findOrDownloadStan();
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
  }
}

run()
