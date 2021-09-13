import { GridConfig, GridCoords, GridSpan, TableOf } from '../model';

export const newTable = <T>(rows: number, cols: number, value: T): TableOf<T> =>
  new Array(rows).fill(null).map(_ => new Array(cols).fill(value));

export const copyTable = <T>(table: TableOf<T>): TableOf<T> =>
  [...table].map(row => [...row]);

export const tableSize = <T>(table: TableOf<T>) => {
  const rows = table.length;
  const cols = rows ? table[0].length : 0;
  return { rows, cols };
};

export const isEmptyRow = <T>(row: Array<T>) => !row.find(cell => !!cell);

export const trimLocation = <T>(
  table: TableOf<T>,
  { col, row }: GridCoords
) => {
  const { cols, rows } = tableSize(table);
  return {
    col: col < 0 ? 0 : col >= cols ? cols - 1 : col,
    row: row < 0 ? 0 : row >= rows ? rows - 1 : row,
  };
};
export const pointToLocation = <T>(
  table: TableOf<T>,
  x: number,
  y: number,
  { elementWidth, elementHeight }: GridConfig
) => {
  const col = Math.floor(x / elementWidth);
  const row = Math.floor(y / elementHeight);
  return trimLocation(table, { col, row });
};

export const fitsInTable = <T>(
  coords: GridCoords & GridSpan,
  table: TableOf<T>
) => {
  const { rows, cols } = tableSize(table);
  for (let row = coords.row; row < coords.row + coords.rowSpan; row++) {
    for (let col = coords.col; col < coords.col + coords.colSpan; col++) {
      if (row > rows || col > cols) return false;
      if (table[row][col]) return false;
    }
  }
  return true;
};

export const placeInTable = <T>(
  coords: GridCoords & GridSpan,
  data: T,
  table: TableOf<T>
): TableOf<T> => {
  const newTable = copyTable(table);
  for (let row = coords.row; row < coords.row + coords.rowSpan; row++) {
    for (let col = coords.col; col < coords.col + coords.colSpan; col++) {
      newTable[row][col] = data;
    }
  }
  return newTable;
};

export const findFirstFittingPosition = <T>(
  span: GridSpan,
  table: TableOf<T>
): GridCoords | undefined => {
  const { rows, cols } = tableSize(table);
  let free = true;
  for (let tableRow = 0; tableRow <= rows - span.rowSpan; tableRow++) {
    for (let tableCol = 0; tableCol <= cols - span.colSpan; tableCol++) {
      //check if all cells are available
      free = true;
      for (let cellRow = 0; cellRow < span.rowSpan; cellRow++) {
        for (let cellCol = 0; cellCol < span.colSpan; cellCol++) {
          free = free && !table[tableRow + cellRow][tableCol + cellCol];
        }
      }
      if (free) {
        return { row: tableRow, col: tableCol };
      }
    }
  }
};
