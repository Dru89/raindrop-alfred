import { Paper, Typography } from '@material-ui/core';

import Link from '../Link';

import styles from './Greeting.module.scss';

interface Props {
  user: {
    name: string;
    email: string;
  };
}

const Greeting = ({ user }: Props): JSX.Element => {
  return (
    <div className={styles.wrapper}>
      <Paper elevation={2} className={styles.greeting}>
        <header>
          <Typography component="h1" variant="h4">
            👋 Hey there!
          </Typography>
          <Typography variant="h6" component="h2">
            We’ve got you logged in as “{user.name}”
          </Typography>
          <Typography variant="body2">
            (And your email address as <code>{user.email}</code>.)
          </Typography>
        </header>
        <Typography variant="body1" className={styles.notRight}>
          If that doesn’t look right to you, please{' '}
          <Link href="/logout">log out</Link> and try again.
        </Typography>
      </Paper>
    </div>
  );
};

export default Greeting;
