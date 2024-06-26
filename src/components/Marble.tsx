import * as React from 'react';
import './Marble.css'
import 'animate.css';
import { ItemType } from '../App.tsx'
import { CoordinateFromIndex } from '../lib/GridApi.tsx';
import { MARGIN_PERCENTAGE, TRANSLATE_MODES } from '../lib/Constants.tsx'

export interface MarbleType {
  type: 'marble';
  color: string;
}


export interface MarbleProps {
  color: string
}

export interface MarbleImageProps {
  id: number,
  delay: number[],
  animationSpeed: number,
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
  const manager:Function = MarbleImageProps.manager
  const translate:number = manager('translate')[id]
  
  const color:string = MarbleImageProps.boardDataSource[id]['color'];
  const matched:boolean = manager('matches').includes(id);
  const redraw:boolean = manager('redraw').includes(id);
  const Interact:Function = manager('interact');
  const interactState:boolean = manager('interactState');

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
    styleParams.animationName = 'pulse-interact'
    styleParams.animationDelay = '0s';
    styleParams.animationDuration = `${animationSpeed*2}s`;
    styleParams.animationIterationCount = 'infinite';
    styleParams.translate = `${translateDrag[0]}rem ${translateDrag[1]}rem`;
    styleParams.transition = `translate .5s`;
  }

  if (matched) {
    styleParams.animationName = 'animate-bounceOutDown';
    styleParams.animationDuration = `${animationSpeed/3}s`;
  } else {
    animation = 'animate-refill'
  }

  if (translate[0] === undefined) {    // newly spawned
    animation = 'animate__bounceInDown'; 
  } else if (translate[0] !== 0 || translate[1] !== 0) {    // transforming translate

    styleParams.animationDelay = '0s';
    let translateDrag = [0, 0];
    const marginPercentageReversed = 100/(1-2*MARGIN_PERCENTAGE);
    if (translate[2] === TRANSLATE_MODES.FROM_0) {
      translationAnimation =`
        @keyframes animate-translate-${id} {
          0%   {transform: translate(0);}
          100%     {
            transform: 
              translateX(${translate[0]*marginPercentageReversed}%)
              translateY(${translate[1]*marginPercentageReversed}%)
          }
        }`;
        styleParams.animationName = `animate-translate-${id}`;
        styleParams.animationDuration = `${animationSpeed/3}s`;
        animation = 'animate-translate';
        styleParams.animationDelay = `0s`;
    } else {
      if (translate[2] === TRANSLATE_MODES.TO_0) {
        translateDrag[0] = -.25*translate[0]; 
        translateDrag[1] = -.25*translate[1];
      };
      translationAnimation =`
        @keyframes animate-fall-${id} {
          0%     {
            transform: 
              translateX(${translate[0]*marginPercentageReversed}%)
              translateX(${translateDrag[0]}rem)
              translateY(${translate[1]*marginPercentageReversed}%)
              translateY(${translateDrag[1]}rem)

              
              translateY(${translateDrag[0]}rem)
              translateX(${translateDrag[1]}rem)
          }
  
          100% {transform: translate(0);}
        }`;
      styleParams.animationName = `animate-fall-${id}`;
      styleParams.animationDuration = `${animationSpeed/2}s`;
      animation = 'animate-fall';
    }
  }

  const AnimationEnd = (e:React.AnimationEvent<HTMLDivElement>):void => {
    if (matched  || animation === 'animate-translate') {
      MarbleImageProps.manager('refill', Number(id));
    } else 
    if (redraw) {
      MarbleImageProps.manager('redraw', Number(id));
    } else 
    if (translate[0] !== 0 || translate[1] !== 0) {
      translationAnimation = "";
      MarbleImageProps.manager('refill', Number(id));
    }
    if (e.animationName === 'create-special') {
      const element = e.target as Element;
      element.classList.remove('create-special');
    }
  };

  const InitiateDrag = (e:React.MouseEvent) => {
    Interact({i: id, e: e});
  }
  const coord = CoordinateFromIndex(id, 9)
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
        ><p>{id}</p><p>({coord[0]},{coord[1]})</p>
        </div>
    </React.Fragment>
  );
};
