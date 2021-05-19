import { Stats } from 'fs';
import * as fs from 'fs/promises';

export async function safeStat(file: string): Promise<Stats | undefined> {
  try {
    return await fs.stat(file);
  } catch (err) {
    return undefined;
  }
}

export async function isFile(file: string): Promise<boolean> {
  const stat = await safeStat(file);
  return stat?.isFile() ?? false;
}

export async function isDir(file: string): Promise<boolean> {
  const stat = await safeStat(file);
  return stat?.isDirectory() ?? false;
}

export function touch(file: string): Promise<void> {
  const now = new Date();
  return fs
    .utimes(file, now, now)
    .catch(() => fs.open(file, 'w').then((fd) => fd.close()));
}
