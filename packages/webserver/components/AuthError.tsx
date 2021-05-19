import React from 'react';
import { Typography } from '@material-ui/core';

import Link from './Link';

type Props = { code: string };
type ErrorProps = Props & { url: string };

const Header = ({ code }: Props): JSX.Element => {
  switch (code) {
    case 'access_denied': {
      return <>😅 It looks like you denied us access!</>;
    }
    case 'invalid_application_status': {
      return <>😳 This API key is broken.</>;
    }
    case 'missing_code': {
      return (
        <>
          🔑 No <code>code</code> query parameter was provided.
        </>
      );
    }
    case 'no_access_token': {
      return <>🔒 We weren’t able to authenticate you.</>;
    }
    case 'bad_user_request': {
      return <>👤 We couldn’t figure out who you are.</>;
    }
    default: {
      return <>🔥 An unknown error occurred!</>;
    }
  }
};

const Body = ({ code }: Props): JSX.Element => {
  switch (code) {
    case 'access_denied': {
      return (
        <>
          If you did that by mistake, you can try logging in again. Otherwise,
          you won‘t be able to use this application.
        </>
      );
    }
    case 'invalid_application_status': {
      return (
        <>
          There’s not a lot to do in this situation, unfortunately. Please
          contact the author or file a{' '}
          <Link href="https://github.com/Dru89/raindrop-alfred/issues">
            GitHub Issue
          </Link>
        </>
      );
    }
    case 'missing_code': {
      return (
        <>Did you come to this page directly? If so, you can try to log in.</>
      );
    }
    case 'no_access_token': {
      return <>Please try logging in again.</>;
    }
    case 'bad_user_request': {
      return <>Please refresh this page or try logging in again.</>;
    }
    default: {
      return <>Please refresh this page or try logging in again.</>;
    }
  }
};

const AuthError = ({ code, url }: ErrorProps): JSX.Element => {
  return (
    <div>
      <Typography component="h2" variant="h4">
        <Header code={code} />
      </Typography>
      <Typography variant="body1">
        <Body code={code} />
      </Typography>
      <Typography variant="body1">
        You can click <Link href={url}>this link</Link> to try again.
      </Typography>
    </div>
  );
};

export default AuthError;
