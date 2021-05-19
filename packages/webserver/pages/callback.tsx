import { createClient, User } from '@dru89/raindrop-api';
import { Typography } from '@material-ui/core';
import { AddressInfo } from 'net';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { TLSSocket } from 'tls';
import AuthError from '../components/AuthError';
import Link from '../components/Link';
import styles from '../styles/Home.module.css';

interface ErrorProps {
  error: true;
  errorCode: string;
  authUrl: string;
}

interface SuccessProps {
  error: false;
  user: User;
}

type Props = ErrorProps | SuccessProps;

export default function Home(props: Props): JSX.Element {
  return (
    <div className={styles.container}>
      <Head>
        <title>Raindrop Alfred Thing</title>
        <meta
          name="description"
          content="A utility for quickly finding things in Raindrop"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🕵️</text></svg>"
        />
      </Head>

      <main className={styles.main}>
        <Typography component="h1" variant="h2">
          {props.error ? '😬 Whoops! Something went wrong!' : '👋 Hey there!'}
        </Typography>

        {props.error ? (
          <AuthError code={props.errorCode} url={props.authUrl} />
        ) : (
          <div>
            <Typography variant="h4" component="h2">
              We’ve got you logged in as “{props.user.fullName}”
            </Typography>
            <Typography variant="body2">
              (And your email address as <code>{props.user.email}</code>.)
            </Typography>
            <Typography variant="body1">
              If that doesn’t look right to you, please{' '}
              <Link href="/logout">log out</Link> and try again.
            </Typography>
          </div>
        )}
      </main>
    </div>
  );
}

function getRedirectUri(ctx: GetServerSidePropsContext) {
  const protocol = (ctx.req.socket as TLSSocket).encrypted ? 'https' : 'http';
  const port =
    (ctx.req.socket.address() as AddressInfo).port ??
    process.env.DEFAULT_PORT ??
    3000;
  const host = ctx.req.headers.host ?? `localhost:${port}`;
  return `${protocol}://${host}/callback`;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  if (!process.env.RAINDROP_CLIENT_ID) {
    throw new Error('RAINDROP_CLIENT_ID was not set');
  }
  if (!process.env.RAINDROP_CLIENT_SECRET) {
    throw new Error('RAINDROP_ CLIENT_SECRET was not set');
  }

  console.log('fooooooo');
  const client = await createClient({
    credentials: {
      clientId: process.env.RAINDROP_CLIENT_ID,
      clientSecret: process.env.RAINDROP_CLIENT_SECRET,
    },
    redirectUri: getRedirectUri(ctx),
  });

  const authUrl = client.createAuthUrl();

  const { code, error } = ctx.query;
  if (typeof error === 'string') {
    return {
      props: {
        error: true,
        errorCode: error,
        authUrl,
      },
    };
  }

  if (typeof code !== 'string') {
    return {
      props: {
        error: true,
        errorCode: 'missing_code',
        authUrl,
      },
    };
  }

  try {
    await client.getAccessToken(code);
  } catch (err) {
    console.error(err);
    return {
      props: {
        error: true,
        errorCode: 'no_access_token',
        authUrl,
      },
    };
  }

  try {
    const response = await client.getUser();
    return {
      props: {
        error: false,
        user: response.user,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {
        error: true,
        errorCode: 'bad_user_request',
        authUrl,
      },
    };
  }
};
