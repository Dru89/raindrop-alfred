import { Paper, Typography } from '@material-ui/core';
import {
  TreeItem,
  TreeView,
  TreeItemProps as MuiTreeItemProps,
} from '@material-ui/lab';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import type { ReactNode } from 'react';

import styles from './CollectionTree.module.scss';

interface Collection {
  id: number;
  name: string;
  count: number;
  children: number[];
  parent?: number;
  icon: string;
}

interface Props {
  groups: Array<{
    name: string;
    count: number;
    collections: number[];
  }>;
  collections: Collection[];
}

interface TreeItemProps extends Omit<MuiTreeItemProps, 'label' | 'nodeId'> {
  id: string;
  name: string;
  count?: number;
  childNodes: number[];
  collections: Collection[];
  icon: ReactNode;
}

const CollectionTreeItem = ({
  id,
  name,
  count,
  childNodes,
  collections,
  icon,
  ...props
}: TreeItemProps): JSX.Element => {
  return (
    <TreeItem
      nodeId={id}
      label={
        <div className={styles.label}>
          {icon}
          <Typography variant="body2" className={styles.labelText}>
            {name}
          </Typography>
          {count != null ? (
            <Typography variant="caption" color="inherit">
              {count}
            </Typography>
          ) : undefined}
        </div>
      }
      {...props}
    >
      {childNodes.map((childId) => {
        const child = collections.find((c) => c.id === childId);
        console.log('child', childId, child, collections);
        if (!child) return null;
        return (
          <CollectionTreeItem
            key={child.id}
            childNodes={child.children}
            collections={collections}
            id={String(child.id)}
            name={child.name}
            count={child.count}
            icon={
              <img
                className={styles.icon}
                src={child.icon}
                alt={`Raindrop Icon for ${child.name}`}
              />
            }
          />
        );
      })}
    </TreeItem>
  );
};

// TODO: For selection stuff, check out https://codesandbox.io/s/n3dl9?file=/demo.tsx:2106-2119
// and https://next.material-ui.com/components/tree-view/#contentcomponent-prop
// for limiting expansion to clicking the little icon. (And we can probably do similar stuff for selections.)
const CollectionTree = ({ groups, collections }: Props): JSX.Element => {
  const ids = groups
    .map((group) => group.name)
    .concat(collections.map((coll) => String(coll.id)));
  return (
    <div className={styles.container}>
      <Paper elevation={2} className={styles.paper}>
        <TreeView
          className={styles.tree}
          defaultExpanded={ids}
          defaultExpandIcon={<ArrowRightIcon />}
          defaultCollapseIcon={<ArrowDropDownIcon />}
        >
          {groups.map((group) => (
            <CollectionTreeItem
              id={group.name}
              name={group.name}
              childNodes={group.collections}
              collections={collections}
              count={group.count}
              icon={
                <CollectionsBookmarkIcon
                  className={styles.icon}
                  color="inherit"
                />
              }
            />
          ))}
        </TreeView>
      </Paper>
    </div>
  );
};

export default CollectionTree;
