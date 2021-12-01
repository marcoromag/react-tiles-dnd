import { StrategyInterface, TilePositionInfo, DragState } from '../model';
import * as TilesTableUtils from '../table-utils/tiles-table';
import * as TableUtils from '../table-utils/table';
import * as TilesUtils from '../table-utils/tiles';

/**
 * Calculates the new table configuration while the tiles are moving
 * @param offsetX
 * @param offsetY
 * @returns
 */
const reorder: StrategyInterface = {
  onDragMove: ({ offsetX, offsetY, config, state, table, canAcceptDrop }) => {
    const { elementHeight, elementWidth, columns } = config;
    const {
      draggingTile,
      dragPosition,
      dropTargetTile,
      droppable,
      start,
      tiles,
    } = state;

    console.log('DRAG MOVE');

    if (!draggingTile || !dragPosition || !start || !tiles) return;

    const getInsertionPoint = <T>(
      tiles: TilePositionInfo<T>[],
      touchPoint: 'left' | 'right',
      touchedTile: TilePositionInfo<T>
    ) => {
      const tilePosition = tiles.findIndex(
        tile => tile.data === touchedTile?.data
      );
      if (touchPoint === 'left') {
        const leftTile =
          tilePosition - 1 >= 0 ? tiles[tilePosition - 1] : undefined;
        if (leftTile === draggingTile) return undefined;
        return {
          insertionPoint: {
            right: touchedTile,
            left: leftTile?.row === touchedTile.row ? leftTile : undefined,
          },
        };
      } else {
        const rightTile =
          tilePosition + 1 < tiles.length ? tiles[tilePosition + 1] : undefined;
        if (rightTile === draggingTile) return undefined;
        return {
          insertionPoint: {
            left: touchedTile,
            right: rightTile?.row === touchedTile.row ? rightTile : undefined,
          },
        };
      }
    };

    const x = start.col * elementWidth + offsetX + dragPosition.x;
    const y = start.row * elementHeight + offsetY + dragPosition.y;

    //find the position of the tile in the grid
    const cell = TableUtils.pointToLocation(table, x, y, config);
    const tsize = TableUtils.tableSize(table);

    //console.log('data:', { x, y, cell, start, draggingTile });

    //try to see if we're touching a hot point
    //find the touched tile within the move

    const touchedTile = table[cell.row][cell.col];
    if (!touchedTile || touchedTile.data === draggingTile.data) return;

    //get the touchpoint of the touched tile
    const touchPoint = TilesUtils.getTileTouchPoint(
      touchedTile,
      touchedTile,
      {
        x,
        y,
      },
      config
    );
    if (!touchPoint) return;

    //console.log('HIT TOUCHPOINT', { table, tiles });
    console.log('touch point:', touchPoint);

    if (touchPoint === 'center') {
      if (touchedTile === dropTargetTile)
        return {
          dropTargetTile,
          droppable,
        };
      if (canAcceptDrop(draggingTile, touchedTile))
        return {
          dropTargetTile: touchedTile,
          droppable: true,
        };
      return;
    }

    //apply calculation only if touching left or right areas
    if (touchPoint !== 'right' && touchPoint !== 'left') return;

    //if the touch point is in the bottom of the cell, pick the adjacent cell
    if (touchedTile.row !== cell.row) {
      const adjacentCol =
        touchPoint === 'left' ? cell.col - 1 : cell.col + touchedTile.colSpan;
      if (adjacentCol < 0 || adjacentCol > tsize.cols) return;
      const adjacentTile = table[cell.row][adjacentCol];
      if (!adjacentTile) return;

      const shiftedInsertionPoint = getInsertionPoint(
        tiles,
        touchPoint === 'left' ? 'right' : 'left',
        adjacentTile
      )?.insertionPoint;
      console.log('SHIFTING: ', { shiftedInsertionPoint, touchPoint });

      return {
        insertionPoint: {
          left:
            touchPoint === 'left' ? shiftedInsertionPoint?.right : undefined,
          right:
            touchPoint === 'right' ? shiftedInsertionPoint?.left : undefined,
        },
      };
    }

    return getInsertionPoint(tiles, touchPoint, touchedTile);
  },

  onDragEnd: ({ state }) => {
    const { insertionPoint, draggingTile, tiles } = state;
    console.log('Drag end start:', {
      insertionPoint,
      draggingTile,
      tiles,
    });

    if (!tiles || !draggingTile || !insertionPoint) return;
    const newTiles = tiles.filter(tile => tile.data !== draggingTile.data);
    const { left, right } = insertionPoint;

    const insertionLeftIdx = left
      ? newTiles.findIndex(tile => tile.data === left.data) + 1
      : -1;
    const insertionRightIdx = right
      ? newTiles.findIndex(tile => tile.data === right.data)
      : -1;

    const insertionIndex =
      insertionLeftIdx > 0 ? insertionLeftIdx : insertionRightIdx;
    if (insertionIndex < 0) newTiles.push(draggingTile);
    else {
      newTiles.splice(insertionIndex, 0, draggingTile);
    }
    console.log('Drag end:', {
      insertionPoint,
      insertionLeftIdx,
      insertionRightIdx,
      draggingTile,
      tiles,
      newTiles,
    });

    return { tiles: newTiles };
  },
};

export default reorder;
