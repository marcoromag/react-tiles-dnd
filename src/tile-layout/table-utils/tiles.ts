import { GridConfig, TilePositionInfo } from '../model';
import { newTable } from './table';

export const positionedTilesMaxRows = <T>(
  positionedTiles: TilePositionInfo<T>[]
) => {
  //calculate the max row
  return positionedTiles.reduce<number>((memo, tile) => {
    const maxTileRow = tile.row + tile.rowSpan;
    return memo > maxTileRow ? memo : maxTileRow;
  }, 0);
};

/**
 * Check if the elements are overlapping in the table
 *
 * @param positionedTiles
 */
export const checkOverlap = <T>(
  positionedTiles: TilePositionInfo<T>[],
  { columns }: GridConfig
) => {
  //calculate the max row
  const maxRows = positionedTilesMaxRows(positionedTiles);

  //create a new temporary table to support the overlap check
  //the rows need to be filled with null  and then mapped,
  //otherwise each row will be identical
  const checkTable = newTable(maxRows, columns, false);

  const overlaps = positionedTiles.find(tile => {
    for (let col = tile.col; col <= tile.col + tile.colSpan - 1; col++) {
      for (let row = tile.row; row <= tile.row + tile.rowSpan - 1; row++) {
        console.log('checktable:', {
          tile,
          row,
          col,
          outcome: checkTable[row][col],
        });
        if (checkTable[row][col] === true) return true;
        checkTable[row][col] = true;
      }
    }
    return false;
  });
  console.log('OVERLAP', overlaps);
  return !!overlaps;
};

export const getTileTouchPoint = <T>(
  draggingTile: TilePositionInfo<T>,
  targetTile: TilePositionInfo<T>,
  absolutePosition: { x: number; y: number },
  { elementHeight, elementWidth, activeBorderSize }: GridConfig
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

export const tileIncludes = <T>(
  tile: TilePositionInfo<T>,
  point: { col: number; row: number; height: number }
) => {
  return (
    tile.col >= point.col &&
    point.col < tile.col + tile.colSpan &&
    tile.row >= point.row &&
    point.row < tile.row + tile.rowSpan
  );
};
