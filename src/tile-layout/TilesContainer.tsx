import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TileInfo, useTileTable } from './TileTableUtils';
import { useMeasure } from 'react-use';
import styles from './TilesContainer.module.css';
import { useComposeRef } from '../utils/useComposedRef';
import { RenderTileFunction, RenderTileProps } from './RenderTileProps';
import { jc } from '../utils/joinclasses';
import { isEqual } from 'lodash-es';

export interface TilesContainerBaseProps<T> {
  /**
   * width/height ration
   */
  ratio?: number;
  forceTileHeight?: number;
  data: T[];
  acceptsDrop?: (source: T, target: T) => boolean;
  onTileDrop?: (source: T, target: T) => boolean;
  tileSize: (data: T) => { rowSpan: number; colSpan: number };
  extractId: (data: T) => string;
  renderTile: RenderTileFunction<T>;
  onReorderTiles?: (reorderedData: T[]) => void;
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
    tileSize,
    renderTile,
    extractId,
  } = props;

  const tileWidth = forceTileWidth || measure.width / columns;
  const tileHeight = forceTileHeight || tileWidth / ratio;

  const [data, setData] = useState<T[]>(propsData);
  useEffect(() => setData(propsData), [propsData, setData]);

  //extract the tiles from the props
  const propsTiles = useMemo(() => {
    const tiles: TileInfo<T>[] = [];
    data.forEach(tile =>
      tiles.push({
        ...tileSize(tile),
        data: tile,
      })
    );
    return tiles;
  }, [data, tileSize]);

  const { bind, renderTileProps, tableHeight } = useTileTable({
    columns,
    elementHeight: tileHeight,
    elementWidth: tileWidth,
    currentTiles: propsTiles,
    canAcceptDrop: (source, target) => {
      return acceptsDrop ? acceptsDrop(source.data, target.data) : false;
    },
    extractId,
    changeTilesOrder: tiles => {
      const newData = tiles.map(tile => tile.data);
      if (!isEqual(data, newData)) {
        setData(newData);
        onReorderTiles && onReorderTiles(newData);
      }
    },
    didDrop: (source, target) => {
      setData(tiles => tiles.filter(tile => tile !== source.data));
      onTileDrop && onTileDrop(source.data, target.data);
    },
  });

  const tiles = useMemo(
    () =>
      renderTileProps.map(({ x, y, ...props }) => (
        <div
          className={jc(styles.tile, props.isDragging && styles.dragging)}
          key={props.id}
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
