import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import * as iter from '@dru89/iter';
import type { Collection as RaindropCollection } from '@dru89/raindrop-api';

import Greeting from '../components/Greeting';
import createRaindropClient from '../utils/createRaindropClient';
import CollectionPicker from '../components/CollectionPicker/CollectionPicker';
import { Collection, Group } from '../types/raindrop-elements';
import computeGroupId from '../utils/computeGroupId';

interface Props {
  user: {
    name: string;
    email: string;
  };
  groups: Group[];
  collections: Collection[];
  selected: string[];
}

const Index: NextPage<Props> = ({
  user,
  groups,
  collections,
  selected,
}: Props) => {
  return (
    <div>
      <Head>
        <title>⚙️ Raindrop Configuration</title>
      </Head>
      <Greeting user={user} />
      <CollectionPicker
        groups={iter.toMap(groups, 'computedId')}
        collections={iter.toMap(collections, (c) => String(c.id))}
        defaultSelected={selected}
      />
    </div>
  );
};

const sum = (numbers: number[]) =>
  numbers.reduce((total, val) => total + val, 0);

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const client = await createRaindropClient(ctx);
  const { user } = await client.getUser();
  const collections = await client.getCollections();
  const children = await client.getChildCollections();

  const tree: Record<number, number[]> = {};
  collections.items.forEach((coll) => {
    // eslint-disable-next-line no-underscore-dangle
    tree[coll._id] = [];
  });
  children.items.forEach((coll) => {
    // eslint-disable-next-line no-underscore-dangle
    const id = coll._id;
    tree[id] = [];
    if (tree[coll.parent.$id] != null) {
      tree[coll.parent.$id].push(id);
    } else {
      tree[coll.parent.$id] = [id];
    }
  });

  const allCollections = collections.items.concat(children.items);

  const totalCount = (collection: RaindropCollection): number =>
    collection.count +
    sum(
      // eslint-disable-next-line no-underscore-dangle
      (tree[collection._id] ?? []).map((id) => {
        // eslint-disable-next-line no-underscore-dangle
        const item = allCollections.find((c) => c._id === id);
        if (!item) return 0;
        return totalCount(item);
      })
    );

  return {
    props: {
      // TODO: preserve selection.
      selected: [],
      user: {
        name: user.fullName,
        email: user.email,
      },
      groups: user.groups.map((group) => ({
        computedId: computeGroupId(group),
        name: group.title,
        count: sum(
          group.collections.map((id) => {
            // eslint-disable-next-line no-underscore-dangle
            const item = allCollections.find((c) => c._id === id);
            if (!item) return 0;
            return totalCount(item);
          })
        ),
        collections: group.collections,
      })),
      collections: allCollections.map((collection) => ({
        // eslint-disable-next-line no-underscore-dangle
        id: collection._id,
        // eslint-disable-next-line no-underscore-dangle
        children: tree[collection._id],
        name: collection.title,
        color: collection.color,
        count: totalCount(collection),
        icon: collection.cover[0],
        ...(collection.parent?.$id
          ? {
              parent: collection.parent?.$id,
            }
          : {}),
      })),
    },
  };
};

export default Index;
