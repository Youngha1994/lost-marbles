import * as React from 'react';
import './TileEffect.css'
import { ANIMATION_EFFECTS } from '../lib/Constants.tsx';

export interface EffectType {
  type: 'effect',
  animation: string,
};

export interface TileEffectProps {
  id: number,
  animationEffect:string[],
  manager: Function
};

export const TileEffect = (TileEffectProps:TileEffectProps):React.JSX.Element => {
  const id = TileEffectProps.id;
  const animation = TileEffectProps.animationEffect[id];
  const ClearTileEffect = TileEffectProps.manager('tileEffect');

  const AnimationEnd = (e) => {
    const element = e.target as Element;
    if (e.target.animationName === ANIMATION_EFFECTS.NONE) return
    element.classList.remove(animation);
    element.classList.add(ANIMATION_EFFECTS.NONE);
    ClearTileEffect(id);
  }

  return (
    <div className={"tile-effect " + animation} onAnimationEnd={AnimationEnd}></div>
  )
}
