import { Typography } from '@material-ui/core';
import {
  TreeItem,
  TreeItemProps as MuiTreeItemProps,
  TreeItemContentProps,
  TreeView,
  useTreeItem,
} from '@material-ui/lab';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import * as iter from '@dru89/iter';
import React, { Ref, ReactNode } from 'react';
import clsx from 'clsx';

import styles from './CollectionTree.module.scss';
import { Collection, Group } from '../../types/raindrop-elements';

export interface Props {
  groups: Map<string, Group>;
  collections: Map<string, Collection>;
  selected: string[];
  onSelected(selected: string[]): void;
}

const CollectionTreeItemContent = React.forwardRef(
  (props: TreeItemContentProps, ref: Ref<unknown>) => {
    const {
      classes,
      className,
      label,
      nodeId,
      icon: iconProp,
      expansionIcon,
      displayIcon,
    } = props;

    const {
      disabled,
      expanded,
      selected,
      focused,
      handleExpansion,
      handleSelection,
      preventSelection,
    } = useTreeItem(nodeId);

    const icon = iconProp ?? expansionIcon ?? displayIcon;
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className={clsx(className, classes.root, {
          [classes.expanded]: expanded,
          [classes.selected]: selected,
          [classes.focused]: focused,
          [classes.disabled]: disabled,
        })}
        onMouseDown={(e) => preventSelection(e)}
        ref={ref as Ref<HTMLDivElement>}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          onClick={(e) => handleExpansion(e)}
          className={classes.iconContainer}
        >
          {icon}
        </div>
        <Typography
          onClick={(e: React.MouseEvent<HTMLDivElement>) => handleSelection(e)}
          component="div"
          className={classes.label}
        >
          {label}
        </Typography>
      </div>
    );
  }
);

interface CollectionTreeItemProps
  extends Omit<MuiTreeItemProps, 'label' | 'ContentComponent'> {
  name: string;
  childNodes: number[];
  collections: Collection[];
  count: number;
  collectionIcon: ReactNode;
}

const CollectionTreeItem = ({
  name,
  childNodes,
  collections,
  count,
  collectionIcon,
  ...props
}: CollectionTreeItemProps) => {
  return (
    <TreeItem
      ContentComponent={CollectionTreeItemContent}
      label={
        <div className={styles.label}>
          {collectionIcon}
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
        if (!child) return null;
        return (
          <CollectionTreeItem
            key={child.id}
            nodeId={String(child.id)}
            name={child.name}
            childNodes={child.children}
            collections={collections}
            count={child.count}
            collectionIcon={
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

const CollectionTree = ({
  groups,
  collections,
  selected,
  onSelected,
}: Props): JSX.Element => {
  const ids = iter.concat(
    iter.map(groups.values(), (g) => g.computedId),
    iter.map(collections.values(), (c) => String(c.id))
  );
  return (
    <TreeView
      className={styles.tree}
      defaultExpanded={[...ids]}
      defaultExpandIcon={<ArrowRightIcon />}
      defaultCollapseIcon={<ArrowDropDownIcon />}
      selected={selected.map(String)}
      disabledItemsFocusable
      onNodeSelect={(e, nodes) => onSelected(nodes)}
      multiSelect
    >
      {iter.map(groups.values(), (group) => (
        <CollectionTreeItem
          key={group.name}
          nodeId={group.computedId}
          name={group.name}
          childNodes={group.collections}
          collections={[...collections.values()]}
          count={group.count}
          collectionIcon={
            <CollectionsBookmarkIcon className={styles.icon} color="inherit" />
          }
        />
      ))}
    </TreeView>
  );
};

export default CollectionTree;
