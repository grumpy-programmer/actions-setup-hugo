import * as core from '@actions/core';
import * as cache from '@actions/tool-cache';
import * as fs from 'fs';
import { Asset, GithubService } from './github';

async function run() {

  const github = new GithubService();

  const version = core.getInput('version', { required: true });

  core.info('version: ' + version);

  const release = await github.getRelease('gohugoio', 'hugo', version);

  const tag = release.tag_name;

  const cachePath = cache.find('hugo', tag);

  if (cachePath != '') {
    core.info('loaded from cache');
    core.addPath(cachePath);
    return;
  }

  core.info('not found in cache');

  const asset = await github.getAsset(release, assetFilter);

  if (asset === undefined) {
    core.error(`could not find asset for version '${version}'`);
    return;
  }

  const url = asset.browser_download_url;

  core.info('download from ' + url);
  const downloadPath = await cache.downloadTool(url);
  core.info('downloaded to ' + downloadPath);

  const extractedPath = await cache.extractTar(downloadPath);

  core.info('extracted to ' + extractedPath);

  const hugoPath = `${extractedPath}/hugo`;

  const mode = '0755';
  core.info('chmod' + mode);
  fs.chmodSync(hugoPath, mode);

  const savedCachePath = await cache.cacheFile(hugoPath, 'hugo', 'hugo', tag);

  core.info('cache saved to ' + savedCachePath);

  core.addPath(savedCachePath);
}

function assetFilter(asset: Asset): boolean {
  return asset.browser_download_url.endsWith('Linux-64bit.tar.gz') && asset.browser_download_url.indexOf('hugo_extended_') < 0;
}


run()
  .catch(e => core.error(e));

