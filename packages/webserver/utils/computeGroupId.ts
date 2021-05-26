import crypto from 'crypto';

import type { UserGroup } from '@dru89/raindrop-api';

const GROUP_ID_PREFIX = 'com.dru89.Group--';
const SHA_256_RE = /[a-fA-F0-9]{64}$/;
const convert = (name: string) =>
  GROUP_ID_PREFIX + crypto.createHash('sha256').update(name).digest('hex');

function computeGroupId(name: string): string;
function computeGroupId(group: UserGroup): string;
function computeGroupId(nameOrGroup: string | UserGroup): string {
  return convert(
    typeof nameOrGroup === 'string' ? nameOrGroup : nameOrGroup.title
  );
}

export function isComputedGroupId(name: string): boolean;
export function isComputedGroupId(group: UserGroup): boolean;
export function isComputedGroupId(nameOrGroup: string | UserGroup): boolean {
  const name =
    typeof nameOrGroup === 'string' ? nameOrGroup : nameOrGroup.title;

  return name.startsWith(GROUP_ID_PREFIX) && SHA_256_RE.test(name);
}

export default computeGroupId;
