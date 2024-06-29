import * as React from 'react';
import './TileEffect.css'
import { ANIMATION_EFFECTS } from '../lib/Constants.tsx';

export interface EffectType {
  type: 'effect',
  animation: string,
};

export interface TileEffectProps {
  id: number,
  animationEffect:[string, number?][],
  manager: Function
};

export const TileEffect = (tileEffectProps:TileEffectProps):React.JSX.Element => {
  const id = tileEffectProps.id;
  const animation = tileEffectProps.animationEffect[id][0];
  const power = tileEffectProps.animationEffect[id][1] || 0;
  const TriggerTileEffect = tileEffectProps.manager('tileEffect');

  const AnimationEnd = (e:React.AnimationEvent<HTMLDivElement>):void => {
    if (e.animationName === ANIMATION_EFFECTS.NONE) return 
    const element = e.target as Element;
    element.classList.remove(animation);
    element.classList.add(ANIMATION_EFFECTS.NONE);
    TriggerTileEffect(id, ANIMATION_EFFECTS.NONE);
  }

  return (
    <div className={"tile-effect " + animation} onAnimationEnd={AnimationEnd}></div>
  )
}
