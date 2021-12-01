import { StrategyInterface, TilePositionInfo } from '../model';
import * as TilesTableUtils from '../table-utils/tiles-table';
import * as TableUtils from '../table-utils/table';
import * as TilesUtils from '../table-utils/tiles';

/**
 * Calculates the new table configuration while the tiles are moving
 * @param offsetX
 * @param offsetY
 * @returns
 */
const dragMove: StrategyInterface = {
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

      const repositionedHoverTiles: TilePositionInfo<any>[] = [];
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
  },
  onDragEnd: () => undefined,
};

export default dragMove;
