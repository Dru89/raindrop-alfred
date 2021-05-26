import { AppProps } from 'next/app';
import Head from 'next/head';
import { Container } from '@material-ui/core';

import '../styles/globals.css';
import usePing from '../hooks/usePing';
import EmojiFavicon from '../components/EmojiFavicon';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  usePing();
  return (
    <Container>
      <Head>
        <meta
          name="description"
          content="A utility for quickly finding things in Raindrop"
        />
        <EmojiFavicon>🕵️</EmojiFavicon>
      </Head>
      <Component {...pageProps} />
    </Container>
  );
}

export default MyApp;
