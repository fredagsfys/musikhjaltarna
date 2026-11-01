/** Build-time facts about the deployed version. Server-side only. */
import { execSync } from 'node:child_process';
import { contentVersion } from '~/content/copy';

function commit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Which version of page and content a visitor saw (brief B §2): the build's commit plus the content
 * hash, so it changes both when code is deployed and when an editor changes copy.yaml.
 */
export const pageVersion = `${commit()}.${contentVersion}`;
