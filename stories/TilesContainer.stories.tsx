import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { TilesContainer } from '../src/tile-layout/TilesContainer';
import { RenderTileFunction } from '../src/tile-layout/RenderTileProps';

const config: ComponentMeta<typeof TilesContainer> = {
  title: 'Components/TilesContainer',
  component: TilesContainer,
};

const tiles = [
  { text: 'Tile 1', cols: 1, rows: 1 },
  { text: 'Tile 2', cols: 1, rows: 1 },
  { text: 'Tile 3', cols: 2, rows: 2 },
  { text: 'Tile 4', cols: 2, rows: 2 },
  { text: 'Tile 5', cols: 1, rows: 1 },
  { text: 'Tile 6', cols: 1, rows: 1 },
  { text: 'Tile 7', cols: 1, rows: 1 },
  { text: 'Tile 8', cols: 1, rows: 1 },
  { text: 'Tile 9', cols: 2, rows: 1 },
];

const render: RenderTileFunction<typeof tiles[0]> = ({ data, isDragging }) => (
  <div style={{ padding: '1rem', width: '100%' }}>
    <div style={{ width: '100%', height: '100%', backgroundColor: '#cecece' }}>
      {data.text} {isDragging ? 'DRAG' : null}
    </div>
  </div>
);
const tileSize = (tile: typeof tiles[0]) => ({
  colSpan: tile.cols,
  rowSpan: tile.rows,
});

const MainStory: ComponentStory<typeof TilesContainer> = function (props) {
  return (
    <TilesContainer
      {...props}
      data={tiles}
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
