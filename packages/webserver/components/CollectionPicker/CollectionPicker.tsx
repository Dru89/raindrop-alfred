import {
  Paper,
  Typography,
  Button,
  Snackbar,
  Slide,
  Alert,
  CircularProgress,
} from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import { Color } from '@material-ui/core/Alert';
import SaveIcon from '@material-ui/icons/Save';
import { useState } from 'react';

import * as iter from '@dru89/iter';
// TODO: I hate that I have to go into the dist folder.
import * as sets from '@dru89/iter/dist/sets';

import { Collection, Group } from '../../types/raindrop-elements';
import CollectionTree from '../CollectionTree';
import useCmdOrCtrl from '../../hooks/useCmdOrCtrl';

import styles from './CollectionPicker.module.scss';
import { isComputedGroupId } from '../../utils/computeGroupId';

interface CollectionPickerProps {
  groups: Map<string, Group>;
  collections: Map<string, Collection>;
  defaultSelected: string[];
}

interface SnackbarAlert {
  severity: Color;
  message: React.ReactNode;
  duration?: number;
}

const SlideUp = (props: TransitionProps) => <Slide {...props} direction="up" />;

const CollectionPicker = ({
  groups,
  collections,
  defaultSelected,
}: CollectionPickerProps): JSX.Element => {
  const ctrl = useCmdOrCtrl();
  const [selected, setSelected] = useState(defaultSelected);
  const [snackbarAlert, setSnackbarAlert] =
    useState<SnackbarAlert | undefined>(undefined);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isAll, setIsAll] = useState(
    iter.every(groups, ([, g]) => defaultSelected.includes(g.computedId))
  );

  const handleSnackbarClose = () => setShowSnackbar(false);

  const getParent = (id: string): string | undefined => {
    const collection = collections.get(id);
    if (!collection) return undefined;
    if (collection.parent != null) return String(collection.parent);
    return iter.find(groups.values(), (g) =>
      g.collections.includes(collection.id)
    )?.computedId;
  };

  const handleSave = () => {
    let request = new Request('/api/save', {
      method: 'POST',
    });

    if (isAll) {
      request = new Request(request, {
        body: JSON.stringify({ all: true }),
      });
    } else {
      const selectedSet: Set<string> = new Set(selected);
      const toRemove = new Set<string>();
      for (const item of selected) {
        const parent = getParent(item);
        if (parent && selectedSet.has(parent)) {
          toRemove.add(item);
        }
      }
      const simplified = sets.difference(selectedSet, toRemove);
      request = new Request(request, {
        body: JSON.stringify({ collections: [...simplified].sort() }),
      });
    }

    const promise = fetch(request);
    const slowTimeout = setTimeout(() => {
      setSnackbarAlert({
        severity: 'info',
        message: (
          <Typography>
            <CircularProgress size="1em" /> Saving your preferences…
          </Typography>
        ),
      });
      setShowSnackbar(true);
    }, 200);

    promise
      .then(() => {
        clearTimeout(slowTimeout);
        setSnackbarAlert({
          severity: 'success',
          message: 'Your changes have been saved. You can close this tab now.',
        });
        setShowSnackbar(true);
      })
      .catch(() => {
        setSnackbarAlert({
          severity: 'error',
          message: 'There was an error saving your collections.',
        });
        setShowSnackbar(true);
      });
  };

  const selectChildren = (
    selection: Set<string>,
    newItems: Set<string>
  ): Set<string> => {
    const newSelection = new Set(selection);
    const nodes: string[] = [...newItems];
    for (let i = 0; i < nodes.length; i += 1) {
      const id = nodes[i];
      const children = isComputedGroupId(id)
        ? iter
            .find(groups.values(), (g) => g.computedId === id)
            ?.collections.map(String) ?? []
        : iter
            .find(collections.values(), (c) => String(c.id) === id)
            ?.children.map(String) ?? [];
      children.forEach((child) => newSelection.add(child));
      nodes.push(...children);
    }
    return newSelection;
  };

  const deselectParents = (
    selection: Set<string>,
    deselected: Set<string>
  ): Set<string> => {
    const newSelection = new Set(selection);
    for (const child of deselected) {
      let node = collections.get(child);
      while (node != null && node.parent) {
        newSelection.delete(String(node.parent));
        node = collections.get(String(node.parent));
      }
      const parentId = node?.id;
      if (parentId) {
        const groupId = iter.find(groups.values(), (g) =>
          g.collections.includes(parentId)
        )?.computedId;
        if (groupId) {
          newSelection.delete(groupId);
        }
      }
    }
    return newSelection;
  };

  return (
    <div className={styles.container}>
      <Paper elevation={2} className={styles.paper}>
        <header className={styles.header}>
          <Typography component="h2" variant="h6">
            Please select a collection for quick search.
          </Typography>
          <Typography variant="caption">
            You can use {ctrl}-click to select multiple items.
          </Typography>
        </header>
        <div className={styles.treeWrapper}>
          <CollectionTree
            groups={groups}
            collections={collections}
            selected={selected}
            onSelected={(newSelected) => {
              const existing = new Set(selected);
              const afterSet = new Set(newSelected);
              const newSet = sets.difference(afterSet, existing);
              const oldSet = sets.difference(existing, afterSet);

              const existingGroups = new Set(
                selected.filter((c) => isComputedGroupId(c))
              );
              const afterGroups = new Set(
                newSelected.filter((c) => isComputedGroupId(c))
              );
              const newGroups = sets.difference(afterGroups, existingGroups);
              const newIsAll = iter.every(groups, ([, g]) =>
                afterGroups.has(g.computedId)
              );
              const withChildren = selectChildren(afterSet, newSet);
              const withoutParents = deselectParents(withChildren, oldSet);

              setIsAll(newIsAll);
              setSelected([...withoutParents]);
              if (newGroups.size && !newIsAll) {
                setSnackbarAlert({
                  severity: 'warning',
                  message: 'Selected groups will break if their name changes.',
                  duration: 5000,
                });
                setShowSnackbar(true);
              }
            }}
          />
        </div>
        <div className={styles.buttonWrapper}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Paper>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={snackbarAlert?.duration}
        onClose={handleSnackbarClose}
        TransitionComponent={SlideUp}
      >
        <Alert severity={snackbarAlert?.severity}>
          {snackbarAlert?.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CollectionPicker;
