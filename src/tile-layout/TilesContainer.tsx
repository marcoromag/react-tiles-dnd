import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTileTable } from './useTileTable';
import { useMeasure } from 'react-use';
import styles from './TilesContainer.module.css';
import { useComposeRef } from '../utils/useComposedRef';
import { jc } from '../utils/joinclasses';
import { isEqual } from 'lodash-es';
import { TileInfo, RenderTileFunction, RenderTileProps } from './model';

export interface TilesContainerBaseProps<T> {
  /**
   * width/height ration
   */
  data: T[];
  renderTile: RenderTileFunction<T>;
  ratio?: number;
  forceTileHeight?: number;
  acceptsDrop?: (source: T, target: T) => boolean;
  onTileDrop?: (source: T, target: T) => boolean;
  tileSize?: (data: T) => { rowSpan: number; colSpan: number };
  disabled?: boolean;
  onReorderTiles?: (reorderedData: T[]) => void;
  activeBorderSize?: number;
}

export interface TilesContainerColsProps<T> extends TilesContainerBaseProps<T> {
  columns: number;
}

export interface TilesContainerForcedSizeProps<T>
  extends TilesContainerBaseProps<T> {
  forceTileWidth: number;
}

const TileUI = React.memo(
  <T,>({
    renderTile,
    ...props
  }: { renderTile: RenderTileFunction<T> } & RenderTileProps<T>) => {
    return renderTile(props);
  }
);

const isTilesContainerForcedSizeProps = <T,>(
  props: TilesContainerBaseProps<T>
): props is TilesContainerForcedSizeProps<T> => !!(props as any).forceTileWidth;

const isTilesContainerColsProps = <T,>(
  props: TilesContainerBaseProps<T>
): props is TilesContainerColsProps<T> => !!(props as any).columns;

export type TilesContainerProps<T> =
  | TilesContainerColsProps<T>
  | TilesContainerForcedSizeProps<T>;

const defaultTileSize = () => ({ rowSpan: 1, colSpan: 1 });

type DataWithKeys<T> = {
  item: T;
  key: number;
};

let lastKey = 0;
const dataWithKeys = <T,>(
  data: T[],
  dataWithKeys: DataWithKeys<T>[]
): DataWithKeys<T>[] => {
  return data.map(item => {
    const existingItem = dataWithKeys.find(k => k.item === item);
    return existingItem || { item, key: lastKey++ };
  });
};

export const TilesContainer = <T,>(props: TilesContainerProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measureRef, measure] = useMeasure<HTMLDivElement>();

  const forceTileWidth = isTilesContainerForcedSizeProps(props)
    ? props.forceTileWidth
    : 0;
  const columns = isTilesContainerColsProps(props)
    ? props.columns
    : forceTileWidth
    ? Math.floor(measure.width / forceTileWidth)
    : 4;
  const {
    onReorderTiles,
    ratio = 1,
    forceTileHeight,
    data: propsData,
    acceptsDrop,
    onTileDrop,
    tileSize = defaultTileSize,
    renderTile,
    activeBorderSize = 24,
    disabled,
  } = props;

  const tileWidth = forceTileWidth || measure.width / columns;
  const tileHeight = forceTileHeight || tileWidth / ratio;

  const [data, setData] = useState<DataWithKeys<T>[]>(() =>
    dataWithKeys(propsData, [])
  );
  useEffect(
    () => setData(curr => dataWithKeys(propsData, curr)),
    [propsData, setData]
  );

  //extract the tiles from the props
  const propsTiles = useMemo(() => {
    const tiles: TileInfo<T>[] = [];
    data.forEach(({ item: tile, key }) =>
      tiles.push({
        key,
        ...tileSize(tile),
        data: tile,
      })
    );
    return tiles;
  }, [data, tileSize]);

  const { bind, renderTileProps, tableHeight } = useTileTable({
    columns,
    enabled: !disabled,
    elementHeight: tileHeight,
    elementWidth: tileWidth,
    activeBorderSize,
    currentTiles: propsTiles,
    canAcceptDrop: (source, target) => {
      return acceptsDrop ? acceptsDrop(source.data, target.data) : false;
    },
    changeTilesOrder: tiles => {
      const newData = tiles.map(tile => tile.data);
      const actualData = data.map(tile => tile.item);
      if (!isEqual(actualData, newData)) {
        setData(curr => dataWithKeys(newData, curr));
        onReorderTiles && onReorderTiles(newData);
      }
    },
    didDrop: (source, target) => {
      setData(tiles => tiles.filter(tile => tile.item !== source.data));
      onTileDrop && onTileDrop(source.data, target.data);
    },
  });

  const tiles = useMemo(
    () =>
      renderTileProps.map(({ x, y, key, ...props }) => (
        <div
          className={jc(styles.tile, props.isDragging && styles.dragging)}
          key={`K-${key}`}
          style={{
            top: `${y}px`,
            left: `${x}px`,
            width: `${props.colSpan * tileWidth}px`,
            height: `${props.rowSpan * tileHeight}px`,
          }}
          {...bind(props.data)}
        >
          <TileUI {...props} renderTile={renderTile as any} />
        </div>
      )),
    [renderTileProps, renderTile, bind, tileWidth, tileHeight]
  );

  return (
    <div
      className={styles.container}
      ref={useComposeRef(containerRef, measureRef)}
      style={{ height: `${tableHeight}px`, minWidth: `${tileWidth}px` }}
    >
      {tiles}
    </div>
  );
};
