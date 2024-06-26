import * as React from 'react';
import './BlankTile.css'

export interface BlankTileType {
  type: "blank";
};

export interface BlankTileProps {
  id: number,
  redrawTiles: number[],
  translate: (number|undefined)[][],
  manager: Function
};

export const BlankTile = ():BlankTileType => {
  return (
    {
      type: "blank"
    }
  )
}

export const BlankTileImage = (BlankTileProps:BlankTileProps):React.JSX.Element => {
  const redraw = BlankTileProps.redrawTiles.includes(BlankTileProps.id);
  if (redraw) {
    BlankTileProps.manager('redraw', Number(BlankTileProps.id));
  }

  if (BlankTileProps.translate[BlankTileProps.id][1] !== 0) {
    BlankTileProps.manager('animateRefill', Number(BlankTileProps.id));
  }
  
  return (
    <div id={BlankTileProps.id.toString()}></div>
  )
}
