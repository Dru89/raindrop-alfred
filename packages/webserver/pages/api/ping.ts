import { NextApiHandler } from 'next';

const ping: NextApiHandler = (req, res) => {
  res.status(204).end();
};

export default ping;
