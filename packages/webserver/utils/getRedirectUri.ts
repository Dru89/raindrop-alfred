import type { AddressInfo } from 'net';
import type { TLSSocket } from 'tls';

import type { GetServerSidePropsContext } from 'next';

export default function getRedirectUri(ctx: GetServerSidePropsContext): string {
  const protocol = (ctx.req.socket as TLSSocket).encrypted ? 'https' : 'http';
  const port =
    (ctx.req.socket.address() as AddressInfo).port ??
    process.env.DEFAULT_PORT ??
    3000;
  const host = ctx.req.headers.host ?? `localhost:${port}`;
  return `${protocol}://${host}/callback`;
}
