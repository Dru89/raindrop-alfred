import { Stats } from 'fs';
import * as fs from 'fs/promises';

export async function safeStat(file: string): Promise<Stats | undefined> {
  try {
    return await fs.stat(file);
  } catch {
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
