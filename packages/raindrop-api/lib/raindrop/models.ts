/* eslint-disable camelcase */
interface CodeAccessTokenRequest {
  grant_type: 'authorization_code';
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface RefreshAccessTokenRequest {
  grant_type: 'refresh_token';
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export type AccessTokenRequest =
  | CodeAccessTokenRequest
  | RefreshAccessTokenRequest;
export interface AccessTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export type EmptyResponse = { result: boolean };

export type ArrayResponse<T> = {
  result: boolean;
  items: T[];
};

export type SingleItemResponse<T> = {
  result: boolean;
  item: T;
};

export const AccessLevel = {
  PUBLIC: 1,
  READ_ONLY: 2,
  COLLABORATOR: 3,
  OWNER: 4,
} as const;

export type ViewStyle = 'list' | 'simple' | 'grid' | 'masonry';

/**
 * See: https://developer.raindrop.io/v1/collections#fields
 */
export interface Collection {
  /** The id of the collection. */
  _id: number;
  access: {
    /** Access level for the collection */
    level: typeof AccessLevel[keyof typeof AccessLevel];
    /** Whether or not the parent can be changed. */
    draggable: boolean;
  };

  /**
   * When this object is present, means that collections is shared.
   * Content of this object is private and not very useful.
   */
  collaborators?: {
    $id: string;
  };

  /** Primary color of collection cover as hex color. */
  color: string;

  /** Count of bookmarks (raindrops) in collection. */
  count: number;

  /** Collection cover URL. This collection will always have only one item. */
  cover: string[];

  /** Date the collection was created. */
  created: string;

  /** Whether the collection's sub-collections are expanded. */
  expanded: boolean;

  /** Date the collection was last updated. */
  lastUpdate: string;

  parent: {
    /**
     * The id of the parent collection. Not specified for root collections.
     */
    $id: number;
  };

  /**
   * Whether or not the collection and bookmarks inside are available
   * without auth through a public link.
   */
  public: boolean;

  /**
   * The order of the collection (descending).
   * Defines the position of the collection among all collections with the same
   * parent.$id.
   */
  sort: number;

  /** The name of the collection. */
  title: string;

  /** The owner of the collection. */
  user: {
    $id: number;
  };

  /** View style of the collection. */
  view: ViewStyle;
}

export type NewCollection = Partial<
  Pick<
    Collection,
    'view' | 'title' | 'sort' | 'public' | 'parent' | 'cover' | 'expanded'
  >
>;

export interface Stats {
  result: boolean;
  items: Array<{ _id: number; count: number }>;
  meta: {
    pro: boolean;
    _id: number;
    changedBookmarksDate: string;
    duplicates: { count: number };
    broken: { count: number };
  };
}

export type BookmarkType =
  | 'link'
  | 'article'
  | 'image'
  | 'video'
  | 'document'
  | 'audio';

/**
 * Bookmark model
 * @see https://developer.raindrop.io/v1/raindrops
 */
export interface Bookmark {
  /** Unique identifier. */
  _id: number;

  collection: {
    /** Collection the bookmark resides in. */
    $id: number;
  };

  /** Bookmark cover URL. */
  cover: string;

  /** Creation date. */
  created: string;

  /** Hostname of a link. Files have a raindrop.io hostname. */
  domain: string;

  /** Description of the bookmark. Max length: 10,000. */
  excerpt: string;

  /** Last updated date. */
  lastUpdate: string;

  /** The bookmark's URL. */
  link: string;

  media: Array<{
    /** URL for the cover. */
    link: string;
  }>;

  /** List of tags for the bookmark. */
  tags: string[];

  /** Bookmark title. Max length: 1000. */
  title: string;

  /** The type of bookmark. */
  type: BookmarkType;

  user: {
    /** Bookmark owner. */
    $id: number;
  };

  // non-standard fields
  /** Whether or not the link is reachable. */
  broken: boolean;
  /** Permanent copy details. */
  cache: {
    status:
      | 'ready'
      | 'retry'
      | 'failed'
      | 'invalid-origin'
      | 'invalid-timeout'
      | 'invalid-size';
    /** Date created. */
    created: string;
    /** Full size in bytes. */
    size: number;
  };
  creatorRef: {
    /** Original user ID of a bookmark. */
    _id: number;
    /** Author's name */
    fullName: string;
  };
  /** Item uploaded from desktop. */
  file?: {
    name: string;
    size: number;
    type: string;
  };
  /** Whether or not it's marked as favorite. */
  important: boolean;
  /**
   * When raindrop is article, image, video, or document, this will have preview HTML.
   * Only visible on single GET requests for bookmarks.
   */
  html?: string;
}

export interface NewBookmark {
  link: string;
  title?: string;

  /**
   * Specify empty object to automatically parse meta data (cover, description, html) in the background.
   */
  pleaseParse?: Record<string, never>;

  /**
   * Specify sort order (ascending).
   * For example if you want to move raindrop to the first place set this
   * field to 0.
   */
  order?: number;

  important?: boolean;
  tags?: string[];
  media?: Array<{ link: string }>;
  cover?: string;
  collection?: { $id: number };
  type?: BookmarkType;
  html?: string;
  excerpt?: string;
  created?: string;
  lastUpdate?: string;
}

export const StaticCollection = {
  ALL: 0,
  UNSORTED: -1,
  TRASH: -99,
};

export type BookmarkSort =
  | 'created'
  | 'title'
  | 'domain'
  | '-created'
  | '-title'
  | '-domain'
  | 'score'
  | '-sort';

export interface MultipleBookmarksRequest {
  sort?: BookmarkSort;
  perpage?: number;
  page?: number;
  search?: string;
}

export interface UpdateMultipleBookmarksRequest {
  ids?: number[];

  /** Mark all bookmarks as favorite. */
  important?: boolean;

  /** Append tags to bookmark. (Empty array will *remove* all tags.) */
  tags?: string[];

  /** Append media to bookmark. (Empty array will *remove* all media.) */
  media?: Array<{ link: string }>;

  /**
   * Set URL for cover.
   * Tip: specify <screenshot> to set screenshots for all raindrops.
   */
  cover: '<screenshot>' | string;

  /** Specify `{ $id: collectionId }` to move raindrops to other collection */
  collection: { $id: number };
}

export interface UserConfig {
  broken_level: 'basic' | 'default' | 'strict' | 'off';
  font_color?: 'sunset' | 'night' | '' | null | undefined;
  font_size: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  lang: string;
  last_collection: number;
  raindrops_sort:
    | 'title'
    | '-title'
    | '-sort'
    | 'domain'
    | '-domain'
    | '+lastUpdate'
    | '-lastUpdate';
  raindrops_view: 'grid' | 'list' | 'simple' | 'masonry';
}

export interface UserGroup {
  title: string;
  hidden: boolean;
  sort: number;
  collections: number[];
}

export interface PublicUser {
  _id: number;
  email_MD5: string;
  fullName: string;
  pro: boolean;
}

export type SocialProvider =
  | 'facebook'
  | 'twitter'
  | 'vkontake'
  | 'google'
  | 'dropbox'
  | 'gdrive';
type Social = { enabled: false };
export type User = PublicUser & {
  config: UserConfig;
  email: string;
  files: {
    used: number;
    size: number;
    lastCheckPoint: string;
  };
  groups: UserGroup[];
  password: boolean;
  proExpire: string;
  registered: string;
} & Record<SocialProvider, Social>;

export interface UpdateUserOptions {
  groups?: UserGroup[];
  config?: UserConfig;
  newpassword?: string;
  oldpassword?: string;
  fullName?: string;
  email?: string;
}
