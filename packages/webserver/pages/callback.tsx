import { User } from '@dru89/raindrop-api';
import { Typography } from '@material-ui/core';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import AuthError from '../components/AuthError';
import Link from '../components/Link';
import createRaindropClient from '../utils/createRaindropClient';

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
    <div>
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

      <main>
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

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const client = await createRaindropClient(ctx);
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
    // eslint-disable-next-line no-underscore-dangle
    console.info(`Successfully logged in ${response.user._id}`);
    return {
      redirect: {
        destination: '/',
      },
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
