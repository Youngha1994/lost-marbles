import * as React from 'react';
import './Marble.css'
import 'animate.css';
import { ItemType } from '../App.tsx'

export interface MarbleType {
  type: 'marble',
  color: string
}

export interface MarbleProps {
  color: string
}

export interface MarbleImageProps {
  id: number,
  delay: number[],
  animationSpeed: number,
  animation: string,
  manager: Function,
  boardDataSource: ItemType[],
};

export interface MarbleImageStyle extends React.CSSProperties {
  '--animate-duration' : string
}

export const Marble = (MarbleImageProps:MarbleProps):MarbleType => {
  return (
    {
      type: "marble",
      color: MarbleImageProps.color
    }
  )
}

export const MarbleImage = (MarbleImageProps: MarbleImageProps):React.JSX.Element => {
  const id:number = MarbleImageProps.id;
  let delay:number = MarbleImageProps.delay[id];
  let animationSpeed:number = MarbleImageProps.animationSpeed;
  let layer:number = 1;
  let animationClass:string = MarbleImageProps.animation;
  const manager:Function = MarbleImageProps.manager
  const translate:number = manager('translate')[id]
  
  const color:string = MarbleImageProps.boardDataSource[id]['color'];
  const matched:boolean = manager('matches').includes(id);
  const redraw:boolean = manager('redraw').includes(id);
  const Interact:Function = manager('interact');
  const interactState:boolean = manager('interactState');
  const CheckSwap:Function = manager('swap');

  let animation:string = "";
  let translationAnimation:string = "";

  const styleParams = {
    background: `radial-gradient(circle at 40% 25%, ${color}, #000)`,
    '--animate-duration': `${animationSpeed}s`,
    animationDelay: `${delay}s`,
    zIndex: layer,
  } as MarbleImageStyle


  if (Interact() === id && interactState) {
    const translateDrag:number[] = manager('translateDrag');
    styleParams.animationName = 'pulseInteract'
    styleParams.animationDelay = '0s';
    styleParams.animationDuration = `${animationSpeed*2}s`;
    styleParams.animationIterationCount = 'infinite';
    styleParams.translate = `${translateDrag[0]}rem ${translateDrag[1]}rem`;
    styleParams.transition = `translate .5s`;
  }

  if (matched || redraw) {
    animation = animationClass;
  }

  if (translate[0] === undefined) {    // newly spawned
    animation = 'animate__bounceInDown'; 
  } else if (translate[0] !== 0 || translate[1] !== 0) {           // dropping
    translationAnimation =`
      @keyframes animate-translate-${id} {
        0%     {transform: translateY(${translate[1]*100}%) translateY(${translate[1]}rem);}
        100%   {transform: translate(0);}
      }`
    styleParams.animationName = `animate-translate-${id}`;
    styleParams.animationDuration = `${animationSpeed/2}s`;
    animation = animationClass;
  } 

  const AnimationEnd = (e:React.AnimationEvent<HTMLDivElement>):void => {
    if (matched) {
      MarbleImageProps.manager('refill', Number(id));
    } 
    if (redraw) {
      MarbleImageProps.manager('redraw', Number(id));
    }
    if (translate[0] !== 0 || translate[1] !== 0) {
      translationAnimation = "";
      MarbleImageProps.manager('refill', Number(id));
    }
  };

  const InitiateDrag = (e:React.MouseEvent) => {
    Interact({i: id, e: e});
  }

  const CheckForSwap = (e) => {
    CheckSwap({i: id, e: e});
  }

  return (
    <React.Fragment>
        {
        translationAnimation.length > 0 &&
          <style>{translationAnimation}</style>
        }
        <div 
          id={id.toString()}
          className={`marble animate__animated ${animation}`} 
          style={styleParams}
          onAnimationEnd={(e) => 
            AnimationEnd(e)
          }
          onMouseDown={(e) => InitiateDrag(e)}
          //onMouseOver={CheckForSwap}
        >
        </div>
    </React.Fragment>
    
  );
};
