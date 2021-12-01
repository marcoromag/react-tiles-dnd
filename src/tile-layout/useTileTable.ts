import { useMemo, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import {
  GridConfig,
  TileInfo,
  TilePositionInfo,
  RenderTileProps,
} from './model';
import * as TilesTableUtils from './table-utils/tiles-table';
import moveStrategy from './strategies/move';
import reorderStrategy from './strategies/reorder';
import { DragState } from './model';
import { reduceRight } from 'lodash';

interface TileTableDNDProps<T> {
  strategy: 'reorder' | 'move';
  enabled: boolean;
  elementWidth: number;
  elementHeight: number;
  activeBorderSize: number;
  columns: number;
  currentTiles: TileInfo<T>[];
  canAcceptDrop: (
    draggingTile: TileInfo<T>,
    targetTile: TileInfo<T>
  ) => boolean;
  didDrop: (draggingTile: TileInfo<T>, targetTile: TileInfo<T>) => void;
  changeTilesOrder: (tiles: TileInfo<T>[]) => void;
}

export const useTileTable = <T>({
  enabled,
  strategy,
  elementWidth,
  elementHeight,
  activeBorderSize,
  columns,
  currentTiles,
  canAcceptDrop,
  changeTilesOrder,
  didDrop,
}: TileTableDNDProps<T>) => {
  const strategyImpl = strategy === 'reorder' ? reorderStrategy : moveStrategy;
  const [state, setState] = useState<DragState<T>>({
    dragging: false,
    droppable: false,
  });

  //the tile layout table
  const { tiles: draggingTiles, dragging, insertionPoint } = state;

  const effectiveTiles = (enabled && dragging && draggingTiles) || currentTiles;

  const table = useMemo(
    () => TilesTableUtils.tilesListToTable(effectiveTiles, columns),
    [effectiveTiles, columns]
  );

  const positionedTiles = useMemo(
    () => TilesTableUtils.tableToTilesList(table),
    [table]
  );

  const config: GridConfig = {
    elementHeight,
    elementWidth,
    activeBorderSize,
    columns,
  };

  const bind = useDrag<React.PointerEvent<HTMLDivElement>>(
    ({ args: [data], dragging, tap, xy, movement, event }) => {
      if (dragging) {
        if (!tap) {
          event.preventDefault();
          event.stopPropagation();
        }

        //if this is the first event, initialize the dragging
        if (!state.dragging) {
          const rect = event.currentTarget.getBoundingClientRect();

          //identify the hit tile
          const draggingTile = positionedTiles.find(tile => tile.data === data);
          if (!draggingTile) return;

          setState({
            dragging: true,
            droppable: false,
            tiles: positionedTiles,
            draggingTile,
            dragPosition: { x: xy[0] - rect.x, y: xy[1] - rect.y },
            offset: { x: movement[0], y: movement[1] },
            start: { col: draggingTile.col, row: draggingTile.row },
          });
        } else {
          const result =
            strategyImpl.onDragMove({
              offsetX: movement[0],
              offsetY: movement[1],
              canAcceptDrop,
              config,
              state,
              table,
            }) || {};
          setState(state => ({
            ...state,
            offset: { x: movement[0], y: movement[1] },
            dropTargetTile: undefined,
            droppable: false,
            insertionPoint: undefined,
            ...result,
          }));
        }
      } else {
        if (state.draggingTile && state.dropTargetTile && state.droppable) {
          didDrop(state.draggingTile, state.dropTargetTile);
        } else {
          const result =
            strategyImpl.onDragEnd({
              offsetX: movement[0],
              offsetY: movement[1],
              canAcceptDrop,
              config,
              state,
              table,
            }) || {};
          const finalState = { ...state, ...result };
          finalState.tiles && changeTilesOrder(finalState.tiles);
        }

        setState({
          dragging: false,
          droppable: false,
        });
      }
    },
    { filterTaps: true, enabled }
  );

  const renderTileProps = useMemo<
    (RenderTileProps<T> & {
      x: number;
      y: number;
      key: number;
    })[]
  >(() => {
    if (!enabled) {
      return positionedTiles
        .map(tile => ({
          ...tile,
          tileWidth: elementWidth,
          tileHeight: elementHeight,
          isDragging: false,
          isDropTarget: false,
          isDroppable: false,
          isDroppableAtInsertPosition: false,
          insertAtLeft: false,
          insertAtRight: false,
          x: tile.col * elementWidth,
          y: tile.row * elementHeight,
        }))
        .sort((a, b) => a.key - b.key);
    } else
      return positionedTiles
        .map(tile => {
          return {
            ...tile,
            tileWidth: elementWidth,
            tileHeight: elementHeight,
            isDragging: tile.data === state.draggingTile?.data,
            isDropTarget: tile.data === state.dropTargetTile?.data,
            insertAtLeft: tile.data === state.insertionPoint?.left?.data,
            insertAtRight: tile.data === state.insertionPoint?.right?.data,
            isDroppable:
              tile.data === state.draggingTile?.data && state.droppable,
            isDroppableAtInsertPosition: !!(
              tile.data === state.draggingTile?.data && state.insertionPoint
            ),
            x:
              tile.data === state.draggingTile?.data
                ? (state.start?.col || 0) * elementWidth +
                  (state.offset?.x || 0)
                : tile.col * elementWidth,
            y:
              tile.data === state.draggingTile?.data
                ? (state.start?.row || 0) * elementHeight +
                  (state.offset?.y || 0)
                : tile.row * elementHeight,
          };
        })
        .sort((a, b) => a.key - b.key);
  }, [state, positionedTiles, elementHeight, elementWidth, enabled]);

  const insertIndicatorPosition = useMemo(() => {
    const { left, right } = insertionPoint || {};
    if (left)
      return {
        x: (left.col + left.colSpan) * elementWidth,
        y: left.row * elementHeight,
      };
    if (right)
      return {
        x: right.col * elementWidth,
        y: right.row * elementHeight,
      };
  }, [insertionPoint, elementHeight, elementWidth]);

  return {
    table,
    tableHeight: table.length * elementHeight,
    tiles: positionedTiles,
    insertIndicatorPosition,
    bind,
    renderTileProps,
  };
};
