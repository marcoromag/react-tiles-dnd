import React, { useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { TilesContainer } from './TilesContainer';
import { RenderTileFunction } from './RenderTileProps';

const config: ComponentMeta<typeof TilesContainer> = {
  title: 'Components/TilesContainer',
  component: TilesContainer,
};

const TileInner: React.FC = ({ children }) => (
  <div style={{ padding: '1rem', width: '100%' }}>
    <div style={{ width: '100%', height: '100%', backgroundColor: '#cecece' }}>
      {children}
    </div>
  </div>
);

const tiles = [
  { text: 'Tile 1', cols: 1, rows: 1 },
  { text: 'Tile 2', cols: 1, rows: 1 },
  { text: 'Tile 3', cols: 2, rows: 2 },
  { text: 'Tile 4', cols: 2, rows: 2 },
  { text: 'Tile 5', cols: 1, rows: 1 },
  { text: 'Tile 6', cols: 1, rows: 1 },
  { text: 'Tile 7', cols: 1, rows: 1 },
  { text: 'Tile 8', cols: 1, rows: 1 },
];

const render: RenderTileFunction<typeof tiles[0]> = ({ data, isDragging }) => (
  <TileInner>
    {data.text} {isDragging ? 'DRAG' : null}
  </TileInner>
);
const extractId = (tile: typeof tiles[0]) => `key of ${tile.text}`;
const tileSize = (tile: typeof tiles[0]) => ({
  colSpan: tile.cols,
  rowSpan: tile.rows,
});

const MainStory: ComponentStory<typeof TilesContainer> = function (props) {
  return (
    <TilesContainer
      {...props}
      data={tiles}
      extractId={extractId}
      renderTile={render}
      tileSize={tileSize}
    ></TilesContainer>
  );
};

export const ColsStory = MainStory.bind({});
ColsStory.storyName = 'Fixed cols, variable size';
ColsStory.args = {
  columns: 4,
  forceTileWidth: undefined,
};

export const FixSizeStory = MainStory.bind({});
FixSizeStory.storyName = 'Fixed size, variable columns';
FixSizeStory.args = {
  forceTileWidth: 200,
  columns: undefined,
};

export default config;
