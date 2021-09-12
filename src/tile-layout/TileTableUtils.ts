import { useMemo, useState } from 'react';
import { useDrag } from 'react-use-gesture';
import { RenderTileProps } from './RenderTileProps';

export type TileInfo<T> = {
  rowSpan: number;
  colSpan: number;
  key: number;
  data: T;
};

export type TilePositionInfo<T> = TileInfo<T> & {
  row: number;
  col: number;
};

type TilesTable<T> = (TilePositionInfo<T> | null)[][];

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
  //the tiles currently in use (could be different in case of dragging)

  const utils = useMemo(() => {
    const tableSize = (table: TilesTable<T>) => {
      const rows = table.length;
      const cols = rows ? table[0].length : 0;
      return { rows, cols };
    };

    const interceptTiles = (
      table: TilesTable<T>,
      startRow: number,
      startCol: number,
      rowSpan: number,
      colSpan: number
    ) => {
      let interceptTiles: TilePositionInfo<T>[] = [];
      const { rows, cols } = tableSize(table);

      for (let row = startRow; row < startRow + rowSpan; row++) {
        if (row >= rows) continue;
        for (let col = startCol; col < startCol + colSpan; col++) {
          if (col >= cols) continue;
          const cell = table[row][col];
          if (
            cell !== null &&
            !interceptTiles.find(t => t.data === cell.data)
          ) {
            interceptTiles.push(cell);
          }
        }
      }

      return interceptTiles.sort(
        (a, b) => a.col + a.row * cols - (b.col + b.row * cols)
      );
    };

    const tilesListToTable = (tiles: TileInfo<T>[]): TilesTable<T> => {
      let table: TilesTable<T> = [];

      const tryPlace = (
        tile: TileInfo<T>,
        startRow: number,
        startCol: number
      ): TilePositionInfo<T> | null => {
        if (!table.length) return null;
        if (startRow + tile.rowSpan > table.length) return null;
        if (startCol + tile.colSpan > table[0].length) return null;

        for (let row = startRow; row < startRow + tile.rowSpan; row++) {
          for (let col = startCol; col < startCol + tile.colSpan; col++) {
            if (table[row][col] !== null) return null;
          }
        }

        const placedTile: TilePositionInfo<T> = {
          ...tile,
          col: startCol,
          row: startRow,
        };

        for (
          let rowSwap = startRow;
          rowSwap < startRow + tile.rowSpan;
          rowSwap++
        ) {
          for (
            let colSwap = startCol;
            colSwap < startCol + tile.colSpan;
            colSwap++
          ) {
            table[rowSwap][colSwap] = placedTile;
          }
        }

        return placedTile;
      };

      tiles.forEach(tile => {
        //first of all, create a new row array, adding empty
        //rows in the same amount as rowSpan
        const emptyRows = new Array(tile.rowSpan)
          .fill(null)
          .map(() => new Array(columns).fill(null));

        //then create a tentative table with the new rows
        table.push(...emptyRows);

        //now iterate through the table to find a possible placement
        for (let row = 0; row <= table.length - tile.rowSpan; row++) {
          for (let col = 0; col <= columns - tile.colSpan; col++) {
            const placedTile = tryPlace(tile, row, col);
            if (placedTile) {
              table = table.filter(row => row.find(col => col !== null));
              return placedTile;
            }
          }
        }
        return null;
      });

      return table;
    };

    const tableToTilesList = (table: TilesTable<T>) => {
      const { rows, cols } = tableSize(table);
      return interceptTiles(table, 0, 0, rows, cols);
    };

    const getTileTouchPoint = (
      draggingTile: TilePositionInfo<T>,
      targetTile: TilePositionInfo<T>,
      absolutePosition: { x: number; y: number }
    ) => {
      const position = {
        x: absolutePosition.x - targetTile.col * elementWidth,
        y: absolutePosition.y - targetTile.row * elementHeight,
      };

      if (draggingTile.col >= targetTile.col && position.x < activeBorderSize)
        return 'left';
      if (
        draggingTile.col <= targetTile.col &&
        position.x > elementWidth * targetTile.colSpan - activeBorderSize
      )
        return 'right';
      if (
        draggingTile.row <= targetTile.row &&
        position.y > elementHeight * targetTile.rowSpan - activeBorderSize
      )
        return 'bottom';
      if (draggingTile.row >= targetTile.row && position.y < activeBorderSize)
        return 'top';
      if (
        position.x > activeBorderSize &&
        position.y < elementWidth * targetTile.colSpan - activeBorderSize &&
        position.y > activeBorderSize &&
        position.y < elementHeight * targetTile.rowSpan - activeBorderSize
      )
        return 'center';
    };

    const trimLocation = (
      table: TilesTable<T>,
      { col, row }: { col: number; row: number }
    ) => {
      const { cols, rows } = tableSize(table);
      return {
        col: col < 0 ? 0 : col >= cols ? cols - 1 : col,
        row: row < 0 ? 0 : row >= rows ? rows - 1 : row,
      };
    };

    const pointToLocation = (table: TilesTable<T>, x: number, y: number) => {
      const col = Math.floor(x / elementWidth);
      const row = Math.floor(y / elementHeight);
      return trimLocation(table, { col, row });
    };

    return {
      pointToLocation,
      tableSize,
      getTileTouchPoint,
      trimLocation,
      interceptTiles,
      tableToTilesList,
      tilesListToTable,
    };
  }, [elementWidth, elementHeight, activeBorderSize, columns]);

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

  const effectiveTiles = (dragging && draggingTiles) || currentTiles;

  const table = useMemo(
    () => utils.tilesListToTable(effectiveTiles),
    [effectiveTiles, utils]
  );

  const positionedTiles = useMemo(
    () => utils.tableToTilesList(table),
    [table, utils]
  );

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
    const cell = utils.pointToLocation(table, x, y);
    const tsize = utils.tableSize(table);

    //console.log('data:', { x, y, cell, start, draggingTile });

    //try to see if we're touching a hot point
    if (cell.col <= tsize.cols && cell.row <= tsize.rows) {
      //find the touched tile within the move

      const touchedTile = table[cell.row][cell.col];
      if (!touchedTile || touchedTile.data === draggingTile.data) return;

      //get the touchpoint of the touched tile
      const touchPoint = utils.getTileTouchPoint(draggingTile, touchedTile, {
        x,
        y,
      });
      if (!touchPoint) return;

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

      //a touchpoint has been identified: now we need to check that all the elements hovered by the new element
      //are fully contained by the drag element

      const rowDisplacement = Math.floor(dragPosition.y / elementHeight);
      const colDisplacement = Math.floor(dragPosition.x / elementWidth);

      //calculate the new dragged tile location. This depends on the touched side.
      const newDragTileLocation = utils.trimLocation(
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
      const hoverTiles = utils
        .interceptTiles(
          table,
          newDragTileLocation.row,
          newDragTileLocation.col,
          draggingTile.rowSpan,
          draggingTile.colSpan
        )
        .filter(tiles => tiles.data !== draggingTile.data);

      if (!hoverTiles.length) {
        return;
      }

      //console.log('hover tiles:', hoverTiles);

      const allFullyContained = hoverTiles.reduce(
        (memo, tile) =>
          memo &&
          tile.col >= newDragTileLocation.col &&
          tile.row >= newDragTileLocation.row &&
          tile.row + tile.rowSpan <=
            newDragTileLocation.row + draggingTile.rowSpan &&
          tile.col + tile.colSpan <=
            newDragTileLocation.col + draggingTile.colSpan,
        true
      );
      //console.log('allFullyContained:', allFullyContained);

      if (!allFullyContained) return;

      //now that all hovered cells are granted to be fully contained, we need to move the cells around.
      //To do this we calculate the colSkew as the difference between the starting column of the drag operation
      // and the farther border of the new position. We do the same for the row
      //FIXME: skewing still has some issues, which need to be understood...
      const colSkew =
        draggingTile.col < newDragTileLocation.col
          ? newDragTileLocation.col +
            (draggingTile.colSpan - 1) -
            draggingTile.col
          : newDragTileLocation.col - draggingTile.col;
      const rowSkew =
        draggingTile.row < newDragTileLocation.row
          ? newDragTileLocation.row +
            (draggingTile.colSpan - 1) -
            draggingTile.row
          : newDragTileLocation.row - draggingTile.row;
      //console.log('skew:', { colSkew, rowSkew });

      //move the elements
      const modifiedTiles = hoverTiles.map(tile => ({
        ...tile,
        col: tile.col - colSkew,
        row: tile.row - rowSkew,
      }));
      const otherTiles = tiles.filter(
        tile =>
          tile.data !== draggingTile.data &&
          !modifiedTiles.find(t => t.data === tile.data)
      );
      const newDraggingTile = {
        ...draggingTile,
        ...newDragTileLocation,
      };

      //sort the elements and recalculate the table
      const reorderedTiles = [
        ...modifiedTiles,
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
