import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const LOG_DIR = path.join(process.cwd(), 'data', 'log');

function parseDateDir(dirName: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dirName)) return null;
  const d = new Date(dirName + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function parseDateZip(fileName: string): Date | null {
  const m = fileName.match(/^(\d{4}-\d{2}-\d{2})\.zip$/);
  if (!m) return null;
  const d = new Date(m[1]! + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

export function rotateLogs(hotRetainDays: number, coldRetainDays: number): void {
  if (!fs.existsSync(LOG_DIR)) {
    logger.warn({ operation: 'log-rotate' }, 'Log directory does not exist, skipping rotation');
    return;
  }

  const now = Date.now();
  const entries = fs.readdirSync(LOG_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirDate = parseDateDir(entry.name);
      if (!dirDate) continue;
      const ageDays = (now - dirDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > hotRetainDays) {
        const dirPath = path.join(LOG_DIR, entry.name);
        const zipName = entry.name + '.zip';
        try {
          execSync('zip -r "' + zipName + '" "' + entry.name + '"', { cwd: LOG_DIR, stdio: 'pipe' });
          fs.rmSync(dirPath, { recursive: true, force: true });
          logger.info({ operation: 'log-rotate', metadata: { directory: entry.name, archive: zipName } }, 'Hot log rotated and compressed');
        } catch (err) {
          logger.error({ operation: 'log-rotate', metadata: { directory: entry.name }, error: err }, 'Failed to rotate hot log');
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.zip')) {
      const zipDate = parseDateZip(entry.name);
      if (!zipDate) continue;
      const ageDays = (now - zipDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > coldRetainDays) {
        try {
          fs.unlinkSync(path.join(LOG_DIR, entry.name));
          logger.info({ operation: 'log-rotate', metadata: { archive: entry.name } }, 'Cold archive pruned');
        } catch (err) {
          logger.error({ operation: 'log-rotate', metadata: { archive: entry.name }, error: err }, 'Failed to prune cold archive');
        }
      }
    }
  }
}
