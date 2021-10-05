import { useMemo, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import {
  GridConfig,
  TileInfo,
  TilePositionInfo,
  RenderTileProps,
} from './model';
import * as TilesTableUtils from './table-utils/tiles-table';
import * as TableUtils from './table-utils/table';
import * as TilesUtils from './table-utils/tiles';
interface TileTableDNDProps<T> {
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
  elementWidth,
  elementHeight,
  activeBorderSize,
  columns,
  currentTiles,
  canAcceptDrop,
  changeTilesOrder,
  didDrop,
}: TileTableDNDProps<T>) => {
  const [state, setState] = useState<{
    dragging: boolean;
    draggingTile?: TilePositionInfo<T>;
    dropTargetTile?: TilePositionInfo<T>;
    droppable: boolean;
    tiles?: TilePositionInfo<T>[];
    dragPosition?: {
      x: number;
      y: number;
    };
    offset?: {
      x: number;
      y: number;
    };
    start?: { col: number; row: number };
  }>({
    dragging: false,
    droppable: false,
  });

  //the tile layout table
  const { tiles: draggingTiles, dragging } = state;

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

  /**
   * Calculates the new table configuration while the tiles are moving
   * @param offsetX
   * @param offsetY
   * @returns
   */
  const dragMove = (
    offsetX: number,
    offsetY: number
  ): Partial<typeof state> | undefined => {
    const {
      draggingTile,
      dragPosition,
      dropTargetTile,
      droppable,
      start,
      tiles,
    } = state;

    if (!draggingTile || !dragPosition || !start || !tiles) return;

    const x = start.col * elementWidth + offsetX + dragPosition.x;
    const y = start.row * elementHeight + offsetY + dragPosition.y;

    //find the position of the tile in the grid
    const cell = TableUtils.pointToLocation(table, x, y, config);
    const tsize = TableUtils.tableSize(table);

    //console.log('data:', { x, y, cell, start, draggingTile });

    //try to see if we're touching a hot point
    if (cell.col <= tsize.cols && cell.row <= tsize.rows) {
      //find the touched tile within the move

      const touchedTile = table[cell.row][cell.col];
      if (!touchedTile || touchedTile.data === draggingTile.data) return;

      //get the touchpoint of the touched tile
      const touchPoint = TilesUtils.getTileTouchPoint(
        draggingTile,
        touchedTile,
        {
          x,
          y,
        },
        config
      );
      if (!touchPoint) return;

      //console.log('HIT TOUCHPOINT', { table, tiles });

      if (touchPoint === 'center') {
        if (touchedTile === dropTargetTile)
          return {
            dropTargetTile,
            droppable,
          };
        if (canAcceptDrop(draggingTile, touchedTile))
          return { dropTargetTile: touchedTile, droppable: true };
        return;
      }

      //a touchpoint has been identified

      const rowDisplacement = Math.floor(dragPosition.y / elementHeight);
      const colDisplacement = Math.floor(dragPosition.x / elementWidth);

      //calculate the new dragged tile location. This depends on the touched side.
      const newDragTileLocation = TableUtils.trimLocation(
        table,
        touchPoint === 'right'
          ? {
              col: cell.col - (draggingTile.colSpan - 1),
              row: cell.row - rowDisplacement,
            }
          : touchPoint === 'left'
          ? {
              col: cell.col,
              row: cell.row - rowDisplacement,
            }
          : touchPoint === 'top'
          ? {
              col: cell.col - colDisplacement,
              row: cell.row,
            }
          : /*touchPoint === 'bottom'*/ {
              col: cell.col - colDisplacement,
              row: cell.row - (draggingTile.rowSpan - 1),
            }
      );

      /*
      console.log(
        'Effective location:',
        newDragTileLocation,
        touchedTile,
        touchPoint,
        state
      );
      */

      //identify all hover tiles (excluding ourselves)
      const hoverTiles = TilesTableUtils.interceptTiles(
        table,
        newDragTileLocation.row,
        newDragTileLocation.col,
        draggingTile.rowSpan,
        draggingTile.colSpan
      ).filter(tiles => tiles.data !== draggingTile.data);

      if (!hoverTiles.length) {
        return;
      }

      //console.log('hover tiles:', hoverTiles);

      //create a table with the remaining tiles
      const otherTiles = tiles.filter(
        tile =>
          tile.data !== draggingTile.data &&
          !hoverTiles.find(t => t.data === tile.data)
      );
      const newDraggingTile = {
        ...draggingTile,
        ...newDragTileLocation,
      };

      let checkTable = TableUtils.newTable(
        tsize.rows + draggingTile.rowSpan - 1,
        tsize.cols,
        0
      );
      otherTiles.forEach(tile => {
        checkTable = TableUtils.placeInTable(tile, 1, checkTable);
      });

      /*
      console.log('checktable dump:');
      checkTable.forEach(row => {
        console.log(row.join(''));
      });
      */

      //try to fit the dragging tile in the current location
      if (!TableUtils.fitsInTable(newDraggingTile, checkTable)) {
        //console.log('new drag tile does not fit');
        return;
      }
      checkTable = TableUtils.placeInTable(newDraggingTile, 1, checkTable);

      /*
      console.log('checktable dump with drag tile:');
      checkTable.forEach(row => {
        console.log(row.join(''));
      });
      */

      const repositionedHoverTiles: TilePositionInfo<T>[] = [];
      if (
        hoverTiles.find(tile => {
          const newPosition = TableUtils.findFirstFittingPosition(
            tile,
            checkTable
          );
          //console.log('fitting', { tile, newPosition });
          if (!newPosition) return true;
          const repositionedTile = { ...tile, ...newPosition };
          repositionedHoverTiles.push(repositionedTile);
          checkTable = TableUtils.placeInTable(repositionedTile, 1, checkTable);
          return false;
        })
      ) {
        //console.log('repositioning failed');
        return;
      }

      const reorderedTiles = [
        ...repositionedHoverTiles,
        ...otherTiles,
        newDraggingTile,
      ].sort((a, b) => a.col + a.row * columns - (b.col + b.row * columns));
      return {
        draggingTile: newDraggingTile,
        tiles: reorderedTiles,
      };
    }
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
          const result = dragMove(movement[0], movement[1]) || {};
          setState(state => ({
            ...state,
            offset: { x: movement[0], y: movement[1] },
            dropTargetTile: undefined,
            droppable: false,
            ...result,
          }));
        }
      } else {
        if (state.draggingTile && state.dropTargetTile && state.droppable) {
          didDrop(state.draggingTile, state.dropTargetTile);
        } else {
          state.tiles && changeTilesOrder(state.tiles);
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
            isDragging: enabled && tile.data === state.draggingTile?.data,
            isDropTarget: tile.data === state.dropTargetTile?.data,
            isDroppable:
              tile.data === state.draggingTile?.data && state.droppable,
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

  return {
    table,
    tableHeight: table.length * elementHeight,
    tiles: positionedTiles,
    bind,
    renderTileProps,
  };
};
