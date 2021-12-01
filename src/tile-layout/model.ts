import React from 'react';

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
  isDroppableAtInsertPosition: boolean;
  insertAtLeft: boolean;
  insertAtRight: boolean;
}

export type RenderTileFunction<T> = (
  props: RenderTileProps<T>
) => React.ReactElement | null;

export type RenderInsertIndicatorFunction = () => React.ReactElement | null;

export type CanAcceptDropFn<T> = (
  draggingTile: TileInfo<T>,
  targetTile: TileInfo<T>
) => boolean;

export interface DragState<T = any> {
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
  insertionPoint?: { left?: TilePositionInfo<T>; right?: TilePositionInfo<T> };
}

export type StrategyInterface<T = any> = {
  onDragMove: (context: {
    offsetX: number;
    offsetY: number;
    state: DragState<T>;
    table: TilesTable<T>;
    config: GridConfig;
    canAcceptDrop: CanAcceptDropFn<T>;
  }) => Partial<DragState<T>> | undefined;
  onDragEnd: (context: {
    offsetX: number;
    offsetY: number;
    state: DragState<T>;
    table: TilesTable<T>;
    config: GridConfig;
    canAcceptDrop: CanAcceptDropFn<T>;
  }) => Partial<DragState<T>> | undefined;
};
