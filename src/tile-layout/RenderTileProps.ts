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
