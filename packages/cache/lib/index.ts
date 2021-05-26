import * as fs from 'fs/promises';
import * as path from 'path';

import { createLogger } from '@dru89/logger';

import * as file from './file';

type Guard<T> = (val: unknown) => val is T;

const read = (filePath: string) => fs.readFile(filePath, 'utf8');
const write = (filePath: string, json: unknown) =>
  fs.writeFile(filePath, JSON.stringify(json), { encoding: 'utf8' });

export class Cache {
  readonly #path: string;
  #mode?: 'file' | 'directory';
  #initialized = false;

  constructor(directory: string) {
    this.#path = directory;
  }

  async initialize(): Promise<void> {
    if (this.#initialized) return;
    const stat = await file.safeStat(this.#path);
    if (!stat) {
      await fs.mkdir(this.#path, { recursive: true });
    } else if (stat.isFile()) {
      // TODO: add logger.
      console.warn(
        'Warning! Cache is in "file" mode, which might cause issues with concurrent cache writes.'
      );
      this.#mode = 'file';
    }
    this.#initialized = true;
  }

  async #getFile(key: string): Promise<unknown> {
    const contents = await read(this.#path);
    const json = JSON.parse(contents) as Record<string, unknown>;
    return json[key];
  }

  async #setFile(key: string, value: unknown): Promise<void> {
    const contents = await read(this.#path);
    const json = JSON.parse(contents) as Record<string, unknown>;
    json[key] = value;
    await write(this.#path, json);
  }

  async #getDir(key: string): Promise<unknown> {
    const filePath = path.join(this.#path, key);
    const stat = await file.safeStat(filePath);
    if (stat?.isDirectory()) {
      throw new Error(`Could not read key ${key}. Invalid file format.`);
    }
    if (stat?.isFile()) {
      const contents = await read(filePath);
      return JSON.parse(contents) as unknown;
    }
    return undefined;
  }

  async #setDir(key: string, value: unknown): Promise<void> {
    const filePath = path.join(this.#path, key);
    const stat = await file.safeStat(filePath);
    if (stat?.isDirectory()) {
      throw new Error(`Could not write key ${key}. Invalid file format.`);
    }
    await write(filePath, value);
  }

  async #get(key: string): Promise<unknown> {
    await this.initialize();
    if (this.#mode === 'directory') {
      return this.#getDir(key);
    }
    return this.#getFile(key);
  }

  async #set(key: string, value: unknown): Promise<void> {
    await this.initialize();
    if (this.#mode === 'directory') {
      return this.#setDir(key, value);
    }
    return this.#setFile(key, value);
  }

  async get(key: string): Promise<unknown>;
  async get<T>(key: string, guard: Guard<T>): Promise<T>;
  async get<T = unknown>(key: string, guard?: Guard<T>): Promise<T> {
    let value: unknown;
    try {
      value = await this.#get(key);
    } catch (err) {
      // TODO: add "RethrownError" class.
      throw new Error(`Could not get ${key} from cache.`);
    }
    if (guard) {
      if (!guard(value)) {
        // TODO: add logger
        console.debug(
          'Expected a file that matched',
          guard,
          'but found',
          value
        );
        // TODO: create custom Error class for this for better handling.
        throw new Error(`Cache for ${key} did not match provided guard.`);
      }
    }
    return value as T;
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.#set(key, value);
    } catch (err) {
      // TODO: add "RethrownError" class.
      throw new Error(`Could not write ${key} to cache.`);
    }
  }
}

export default async function createCache(dir: string): Promise<Cache> {
  const cache = new Cache(dir);
  await cache.initialize();
  return cache;
}
