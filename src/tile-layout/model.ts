export type GridSpan = {
  rowSpan: number;
  colSpan: number;
};

export type GridCoords = {
  row: number;
  col: number;
};

export type TileInfo<T> = {
  key: number;
  data: T;
} & GridSpan;

export type TilePositionInfo<T> = TileInfo<T> & GridCoords;

export type TableOf<T> = Array<Array<T>>;

export type TilesTable<T> = TableOf<TilePositionInfo<T> | null>;

export type GridConfig = {
  elementWidth: number;
  elementHeight: number;
  activeBorderSize: number;
  columns: number;
};

export interface RenderTileProps<T> {
  data: T;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  tileWidth: number;
  tileHeight: number;
  isDragging: boolean;
  isDropTarget: boolean;
  isDroppable: boolean;
}

export type RenderTileFunction<T> = (
  props: RenderTileProps<T>
) => React.ReactElement | null;
