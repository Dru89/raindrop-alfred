import * as qs from 'querystring';
import * as fs from 'fs/promises';
import { homedir } from 'os';
import { dirname } from 'path';

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  CancelTokenSource,
  Method,
} from 'axios';

import {
  AccessTokenRequest,
  AccessTokenResponse,
  ArrayResponse,
  Bookmark,
  Collection,
  EmptyResponse,
  MultipleBookmarksRequest,
  NewBookmark,
  NewCollection,
  PublicUser,
  SingleItemResponse,
  SocialProvider,
  StaticCollection,
  Stats,
  UpdateMultipleBookmarksRequest,
  UpdateUserOptions,
  User,
} from './models';

import ErrorWithCause from '../ErrorWithCause';
import { isFile } from '../utils/file';

interface Credentials {
  clientId: string;
  clientSecret: string;
}

interface ClientOptions {
  cache?: boolean | string;
  ttl?: number;
  credentials: Credentials;
  redirectUri: string;
}

interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expires: Date;
}

const METHODS_WITHOUT_BODIES: Method[] = [
  'get',
  'GET',
  'head',
  'HEAD',
  'delete',
  'DELETE',
  'options',
  'OPTIONS',
];

function handleError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const response = (err.response?.data ?? {}) as {
      error?: string;
      errorMessage?: string;
    };
    if (response && response.error) {
      let message = `[${response.error}]`;
      if (response.errorMessage) {
        message = `${message} ${response.errorMessage}`;
      }
      throw new ErrorWithCause(`Raindrop.io returned error: ${message}`, {
        cause: err,
      });
    }
  }
  throw new ErrorWithCause('Received unknown Raindrop.io error', {
    cause: err,
  });
}

export class RaindropClient {
  readonly #clientId: string;
  readonly #clientSecret: string;
  readonly #redirectUri: string;
  readonly #cancelToken: CancelTokenSource;
  readonly #client: AxiosInstance;

  protected token?: OAuthToken;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
    this.#redirectUri = redirectUri;
    this.#cancelToken = axios.CancelToken.source();

    this.#client = axios.create({
      baseURL: 'https://api.raindrop.io/rest/v1',
      cancelToken: this.#cancelToken.token,
    });
  }

  needsRefresh(): boolean {
    const expires = this.token?.expires ?? 0;
    return Date.now() >= expires;
  }

  storeToken(response: AccessTokenResponse): void {
    this.token = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      expires: new Date(Date.now() + 1000 * (response.expires_in / 2)),
    };
  }

  private handleTokenRequest(data: AccessTokenRequest) {
    return this.#client
      .post<AccessTokenResponse>('https://raindrop.io/oauth/access_token', data)
      .then((resp) => this.storeToken(resp.data))
      .catch((err) => handleError(err));
  }

  async getAccessToken(code: string): Promise<void> {
    return this.handleTokenRequest({
      code,
      client_id: this.#clientId,
      client_secret: this.#clientSecret,
      redirect_uri: this.#redirectUri,
      grant_type: 'authorization_code',
    });
  }

  async refreshToken(): Promise<void> {
    const token = this.token?.refreshToken;
    if (!token) {
      throw new Error(
        'Could not refresh Raindrop.io token: No refresh token provided.'
      );
    }
    return this.handleTokenRequest({
      grant_type: 'refresh_token',
      client_id: this.#clientId,
      client_secret: this.#clientSecret,
      refresh_token: token,
    });
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (this.needsRefresh()) {
      await this.refreshToken();
    }
  }

  private async getToken(path: string): Promise<OAuthToken> {
    if (!this.token) {
      throw new Error(`Cannot request ${path}. No token provided.`);
    }
    await this.refreshTokenIfNeeded();
    if (!this.token.accessToken || !this.token.tokenType) {
      throw new Error(`Cannot request ${path}. No valid access token.`);
    }
    return this.token;
  }

  private async decorateConfig(
    path: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosRequestConfig> {
    const token = await this.getToken(path);
    return {
      ...config,
      headers: {
        ...((config.headers as Record<string, unknown>) ?? {}),
        authorization: `${token.tokenType} ${token.accessToken}`,
      },
    };
  }

  private async request<Response>(
    method: Method,
    path: string
  ): Promise<Response>;

  private async request<Response, Request = unknown>(
    method: Method,
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response>;

  private async request<Response>(
    method: Method,
    path: string,
    config: AxiosRequestConfig
  ): Promise<Response>;

  private async request<Response, Request = unknown>(
    method: Method,
    path: string,
    dataOrConfig?: Request | AxiosRequestConfig,
    originalConfig?: AxiosRequestConfig
  ): Promise<Response> {
    let config = originalConfig ?? {};
    config = { method, url: path, ...config };
    if (METHODS_WITHOUT_BODIES.includes(method)) {
      config = dataOrConfig as AxiosRequestConfig;
      if (originalConfig) {
        throw new Error(
          `Too many arguments provided. ${method} requests cannot have body data.`
        );
      }
    } else {
      const configData = (config.data ?? {}) as Record<string, unknown>;
      config = { ...config, data: { ...dataOrConfig, ...configData } };
    }
    config = await this.decorateConfig(path, config);
    return this.#client
      .request<Response>(config)
      .then((resp) => resp.data)
      .catch((err) => handleError(err));
  }

  get<Response>(path: string, config?: AxiosRequestConfig): Promise<Response> {
    return this.request<Response>('get', path, config);
  }

  delete<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    return this.request<Response>('delete', path, config);
  }

  head<Response>(path: string, config?: AxiosRequestConfig): Promise<Response> {
    return this.request<Response>('head', path, config);
  }

  options<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    return this.request<Response>('options', path, config);
  }

  post<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    return this.request<Response, Request>('post', path, data, config);
  }

  put<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    return this.request<Response, Request>('put', path, data, config);
  }

  patch<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    return this.request<Response, Request>('patch', path, data, config);
  }

  async getCollections(): Promise<ArrayResponse<Collection>> {
    return this.get<ArrayResponse<Collection>>('/collections');
  }

  async getCollection(id: number): Promise<SingleItemResponse<Collection>> {
    return this.get<SingleItemResponse<Collection>>(`/collection/${id}`);
  }

  async getChildCollections(): Promise<ArrayResponse<Collection>> {
    return this.get<ArrayResponse<Collection>>('/collections/childrens');
  }

  async createCollection(
    collection: NewCollection
  ): Promise<SingleItemResponse<Collection>> {
    return this.post<SingleItemResponse<Collection>, NewCollection>(
      '/collection',
      collection
    );
  }

  async updateCollection(
    id: number,
    collection: NewCollection
  ): Promise<SingleItemResponse<Collection>> {
    return this.put<SingleItemResponse<Collection>, NewCollection>(
      `/collection/${id}`,
      collection
    );
  }

  async removeCollection(id: number): Promise<EmptyResponse> {
    return this.delete<EmptyResponse>(`/collections/${id}`);
  }

  async removeCollections(ids: number[]): Promise<EmptyResponse> {
    return this.delete<EmptyResponse>(`/collections`, { data: { ids } });
  }

  async reorderAllCollections(
    sort: 'title' | '-title' | 'count' | '-count'
  ): Promise<EmptyResponse> {
    return this.put<EmptyResponse, { sort: typeof sort }>('/collections', {
      sort,
    });
  }

  async expandAllCollections(): Promise<EmptyResponse> {
    return this.put<EmptyResponse, { expanded: boolean }>('/collections', {
      expanded: true,
    });
  }

  async collapseAllCollections(): Promise<EmptyResponse> {
    return this.put<EmptyResponse, { expanded: boolean }>('/collections', {
      expanded: false,
    });
  }

  async mergeCollections(to: number, ids: number[]): Promise<EmptyResponse> {
    return this.put<EmptyResponse, { to: number; ids: number[] }>(
      '/collections/merge',
      { to, ids }
    );
  }

  async removeEmptyCollections(): Promise<EmptyResponse> {
    return this.put<EmptyResponse, Record<string, never>>(
      '/collections/merge',
      {}
    );
  }

  async emptyTrash(): Promise<EmptyResponse> {
    return this.delete<EmptyResponse>('/collection/-99');
  }

  async getStats(): Promise<Stats> {
    return this.get<Stats>('/user/stats');
  }

  async getBookmark(id: number): Promise<SingleItemResponse<Bookmark>> {
    return this.get<SingleItemResponse<Bookmark>>(`/raindrop/${id}`);
  }

  async getBookmarks(
    collection = StaticCollection.ALL,
    options: MultipleBookmarksRequest = {}
  ): Promise<ArrayResponse<Bookmark>> {
    if (
      options.perpage != null &&
      (options.perpage <= 0 || options.perpage > 50)
    ) {
      throw new Error('Maximum of 50 bookmarks allowed per request.');
    }
    return this.get<ArrayResponse<Bookmark>>(`/raindrops/${collection}`, {
      params: options,
    });
  }

  async getCachedBookmark(id: number): Promise<string> {
    const path = `/${id}/cache`;
    const config: AxiosRequestConfig = { maxRedirects: 0 };
    const decorated = await this.decorateConfig(path, config);
    return this.#client.get(path, decorated).then(
      (resp) => {
        if (Math.floor(resp.status / 100) === 3) {
          return (resp.headers as Record<string, string>).location;
        }
        throw new Error(
          `Received unexpected response for cached bookmark. Expected 3XX status, got ${resp.status}.`
        );
      },
      (err) => {
        handleError(err);
      }
    );
  }

  async createBookmark(
    bookmark: NewBookmark
  ): Promise<SingleItemResponse<Bookmark>> {
    return this.post<SingleItemResponse<Bookmark>, NewBookmark>(
      '/raindrop',
      bookmark
    );
  }

  async createBookmarks(
    bookmarks: NewBookmark[]
  ): Promise<ArrayResponse<Bookmark>> {
    return this.put<ArrayResponse<Bookmark>, { items: NewBookmark[] }>(
      `/raindrops`,
      {
        items: bookmarks,
      }
    );
  }

  async updateBookmark(
    id: number,
    bookmark: Partial<NewBookmark>
  ): Promise<SingleItemResponse<Bookmark>> {
    return this.put<SingleItemResponse<Bookmark>, Partial<NewBookmark>>(
      `/raindrop/${id}`,
      bookmark
    );
  }

  async updateBookmarks(
    collection: number,
    request: UpdateMultipleBookmarksRequest
  ): Promise<ArrayResponse<Bookmark>> {
    if (collection === StaticCollection.ALL) {
      throw new Error(
        "Can't update bookmarks across all collections. Please pick one collection."
      );
    }
    return this.put<ArrayResponse<Bookmark>, UpdateMultipleBookmarksRequest>(
      `/raindrops/${collection}`,
      request
    );
  }

  async deleteBookmark(id: number): Promise<EmptyResponse> {
    return this.delete<EmptyResponse>(`/raindrop/${id}`);
  }

  async deleteBookmarks(
    collection: number,
    options: { search?: string; ids?: number } = {}
  ): Promise<EmptyResponse> {
    return this.delete<EmptyResponse>(`/raindrops/${collection}`, {
      params: options.search ? { search: options.search } : undefined,
      data: options.ids ? { ids: options.ids } : undefined,
    });
  }

  async getUser(): Promise<{ result: boolean; user: User }>;
  async getUser(id: number): Promise<{ result: boolean; user: PublicUser }>;
  async getUser(
    id?: number
  ): Promise<{ result: boolean; user: User | PublicUser }> {
    if (id != null) {
      return this.get<{ result: boolean; user: PublicUser }>(`/user/${id}`);
    }
    return this.get<{ result: boolean; user: User }>('/user');
  }

  async updateUser(
    options: UpdateUserOptions
  ): Promise<{ result: boolean; user: User }> {
    return this.put<{ result: boolean; user: User }, UpdateUserOptions>(
      '/user',
      options
    );
  }

  async connect(provider: SocialProvider): Promise<string> {
    const path = `/user/connect/${provider}`;
    const config: AxiosRequestConfig = { maxRedirects: 0 };
    const decorated = await this.decorateConfig(path, config);
    return this.#client.get(path, decorated).then(
      (resp) => {
        if (Math.floor(resp.status / 100) === 3) {
          return (resp.headers as Record<string, string>).location;
        }
        throw new Error(
          `Received unexpected response for social connect. Expected 3XX status, got ${resp.status}.`
        );
      },
      (err) => {
        handleError(err);
      }
    );
  }

  async disconnect(provider: SocialProvider): Promise<EmptyResponse> {
    return this.get<EmptyResponse>(`/user/connect/${provider}/revoke`);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable class-methods-use-this */
  async uploadCollectionCover(
    id: number,
    file: string | Buffer
  ): Promise<never> {
    return Promise.reject(new Error('Not implemented. No file support.'));
  }

  async uploadFile(id: number, file: string | Buffer): Promise<never> {
    return Promise.reject(new Error('Not implemented. No file support.'));
  }

  async uploadBookmarkCover(id: number, file: string | Buffer): Promise<never> {
    return Promise.reject(new Error('Not implemented. No file support.'));
  }
  /* eslint-enable class-methods-use-this */
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

type Cached<T> = { expires: number; data: T };
type Cache = { token?: OAuthToken; data: Record<string, Cached<unknown>> };
const cacheKey = (method: string, path: string, config?: AxiosRequestConfig) =>
  `${method} ${path}?${qs.stringify(config?.params ?? '')}`;
export class CachedRaindropClient extends RaindropClient {
  #cacheFile: string;
  #ttl: number;
  #cache: Cache;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    cacheFile: string,
    ttl: number
  ) {
    super(clientId, clientSecret, redirectUri);
    this.#cacheFile = cacheFile;
    this.#ttl = ttl;
    this.#cache = { data: {} };
  }

  async initialize(): Promise<void> {
    const file = this.#cacheFile;
    if (!(await isFile(file))) {
      await fs.mkdir(dirname(file), { recursive: true });
      const buffer = await fs.readFile(file);
      this.#cache = JSON.parse(buffer.toString('utf8')) as Cache;
    }
  }

  cacheGet<Response>(
    method: string,
    path: string,
    config?: AxiosRequestConfig
  ): Response | undefined {
    if (this.#cache) {
      const key = cacheKey(method, path, config);
      const response = this.#cache.data[key];
      if (response && response.data && response.expires > Date.now()) {
        return response.data as Response;
      }
    }
    return undefined;
  }

  cacheSet<Response>(
    method: string,
    path: string,
    config: AxiosRequestConfig | undefined,
    data: Response
  ): void {
    if (this.#cache) {
      const key = cacheKey(method, path, config);
      this.#cache.data[key] = {
        data,
        expires: Date.now() + this.#ttl,
      };
    }
  }

  storeToken(response: AccessTokenResponse): void {
    super.storeToken(response);
    this.#cache.token = this.token;
  }

  async get<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const cached = this.cacheGet<Response>('GET', path, config);
    if (cached) return cached;

    const result = await super.get<Response>(path, config);
    this.cacheSet('GET', path, config, result);
    return result;
  }

  delete<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    if (this.#cache) this.#cache.data = {};
    return super.delete<Response>(path, config);
  }

  async head<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const cached = this.cacheGet<Response>('HEAD', path, config);
    if (cached) return cached;

    const result = await super.head<Response>(path, config);
    this.cacheSet('HEAD', path, config, result);
    return result;
  }

  async options<Response>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    const cached = this.cacheGet<Response>('OPTIONS', path, config);
    if (cached) return cached;

    const result = await super.options<Response>(path, config);
    this.cacheSet('OPTIONS', path, config, result);
    return result;
  }

  post<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    if (this.#cache) this.#cache.data = {};
    return super.post<Response, Request>(path, data, config);
  }

  put<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    if (this.#cache) this.#cache.data = {};
    return super.put<Response, Request>(path, data, config);
  }

  patch<Response, Request>(
    path: string,
    data: Request,
    config?: AxiosRequestConfig
  ): Promise<Response> {
    if (this.#cache) this.#cache.data = {};
    return super.patch<Response, Request>(path, data, config);
  }
}

const DEFAULT_CACHE_FILE = `${homedir()}/.local/config/pennyworth`;
const DEFAULT_TTL = 5 * 60 * 1000;
export async function createClient({
  cache = true,
  ttl = DEFAULT_TTL,
  credentials,
  redirectUri,
}: ClientOptions): Promise<RaindropClient> {
  if (cache) {
    const file = typeof cache === 'string' ? cache : DEFAULT_CACHE_FILE;
    const client = new CachedRaindropClient(
      credentials.clientId,
      credentials.clientSecret,
      redirectUri,
      file,
      ttl
    );
    await client.initialize();
    return client;
  }
  return new RaindropClient(
    credentials.clientId,
    credentials.clientSecret,
    redirectUri
  );
}
