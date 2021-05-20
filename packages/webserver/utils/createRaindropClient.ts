import { createClient, RaindropClient } from '@dru89/raindrop-api';
import type { GetServerSidePropsContext } from 'next';

import getRedirectUri from './getRedirectUri';

export default function createRaindropClient(
  ctx: GetServerSidePropsContext
): Promise<RaindropClient> {
  if (!process.env.RAINDROP_CLIENT_ID) {
    throw new Error('RAINDROP_CLIENT_ID was not set');
  }

  if (!process.env.RAINDROP_CLIENT_SECRET) {
    throw new Error('RAINDROP_ CLIENT_SECRET was not set');
  }

  return createClient({
    credentials: {
      clientId: process.env.RAINDROP_CLIENT_ID,
      clientSecret: process.env.RAINDROP_CLIENT_SECRET,
    },
    redirectUri: getRedirectUri(ctx),
  });
}
