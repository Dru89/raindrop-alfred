import { NextApiHandler } from 'next';

const save: NextApiHandler = (req, res) => {
  console.log('TODO: Write to file.');
  setTimeout(() => res.status(204).end(), 3000);
};

export default save;
