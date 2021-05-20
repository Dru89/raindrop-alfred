import { AppProps } from 'next/app';
import { Container } from '@material-ui/core';

import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <Container>
      <Component {...pageProps} />
    </Container>
  );
}

export default MyApp;
