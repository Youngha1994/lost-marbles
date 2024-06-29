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

export const BlankTileImage = (blankTileProps:BlankTileProps):React.JSX.Element => {
  const redraw = blankTileProps.redrawTiles.includes(blankTileProps.id);
  if (redraw) {
    blankTileProps.manager('redraw', Number(blankTileProps.id));
  }
  
  return (
    <div id={blankTileProps.id.toString()}></div>
  )
}
