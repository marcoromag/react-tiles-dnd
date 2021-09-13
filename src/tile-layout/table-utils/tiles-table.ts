import { TilesTable, TilePositionInfo, TileInfo } from '../model';
import {
  findFirstFittingPosition,
  isEmptyRow,
  newTable,
  placeInTable,
  tableSize,
} from './table';

export const interceptTiles = <T>(
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
      if (cell && !interceptTiles.find(t => t.data === cell.data)) {
        interceptTiles.push(cell);
      }
    }
  }

  return interceptTiles.sort(
    (a, b) => a.col + a.row * cols - (b.col + b.row * cols)
  );
};

export const tableToTilesList = <T>(table: TilesTable<T>) => {
  const { rows, cols } = tableSize(table);
  return interceptTiles(table, 0, 0, rows, cols);
};

export const tilesListToTable = <T>(
  tiles: TileInfo<T>[],
  columns: number
): TilesTable<T> => {
  const maxRows = tiles.reduce((memo, tile) => memo + tile.rowSpan, 0);
  let table = newTable<TilePositionInfo<T> | undefined>(
    maxRows,
    columns,
    undefined
  );
  tiles.forEach(tile => {
    let position = findFirstFittingPosition(tile, table);
    if (position) {
      const fittedTile: TilePositionInfo<T> = { ...tile, ...position };
      table = placeInTable(fittedTile, fittedTile, table);
    }
  });

  //trim the table

  return table.filter(row => !isEmptyRow(row)) as TilesTable<T>;
};
