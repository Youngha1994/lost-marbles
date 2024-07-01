import * as React from 'react';
import './Board.css';
import { useRef, useState, CSSProperties } from 'react';
import { BlankTile, BlankTileImage, BlankTileProps } from './BlankTile.tsx';
import { MatchableImage, MatchableImageProps } from './Matchable.tsx';
import { Special, SPECIALS } from './Special.tsx';
import { TileEffect } from './TileEffect.tsx';
import { CalculateAnimationSpeed, CoordinateFromIndex, xrange } from '../lib/GridApi.tsx';
import { ANIMATION_EFFECTS, INTERACTION_STATES, TRANSLATE_MODES } from '../lib/Constants.tsx';
import { ItemType, MovableType } from '../App.tsx';

interface BoardProps {
  setScore: Function,
  setMoves: Function,
  movesFunctions: Function[],
  scoreList: {},
  size: [number, number],
  gameSpeed: number,
  bag: ItemType[],
  initialBoard: ItemType[],
  bulletTime: boolean,
  specials: {[key:number]: {"power": number}},
  playable: boolean,
  gameOver: boolean,
};

const Board = (boardProps:BoardProps):React.JSX.Element => {
  const setScore = boardProps.setScore;
  const setMoves = boardProps.setMoves;
  const CheckForMoves = boardProps.movesFunctions[0];
  const CheckForScore = boardProps.movesFunctions[1];
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [interactionIndex, setInteractionIndex] = useState<number>(-1);

  const size:number[] = boardProps.size;
  const gameSpeed:number = boardProps.gameSpeed;
  const bag:ItemType[] = boardProps.bag;
  const bulletTime:boolean = boardProps.bulletTime;
  const specials = boardProps.specials
  const scoreList = boardProps.scoreList

  let indices:number[] = xrange(size[0] * size[1]);
  const [delay, setDelay] = useState<number[]>(
    indices.map(index => {
      return (Math.random() + (indices.length - index - 1)/(size[0]))/(4+4*gameSpeed);
    })
  )
  
  const [redrawTiles, setRedrawTiles] = useState<number[]>(indices.slice(0));
  const [translate, setTranslate] = useState<(number|undefined)[][]>(
    Array.from({length:indices.length}, () => [undefined, undefined, TRANSLATE_MODES.TO_0])
  );
  const [translateDrag, setTranslateDrag] = useState<number[]>([0, 0, TRANSLATE_MODES.EASE_IN])
  const [animationEffect, setAnimationEffect] = useState<[string, number][]>(Array(indices.length).fill([ANIMATION_EFFECTS.NONE, 0]))

  const swapped = useRef<boolean>(false);
  const tileWidth = useRef<number>(0);
  const specialSpawn = useRef<{[index: number]: number}>({});
  const lastInteraction = useRef<number[]>([-1, -1]);
  const interactionState = useRef<number>(INTERACTION_STATES.NO_MATCH_AFTER_FALLING);
  const boardDataSource = useRef<ItemType[]>(boardProps.initialBoard);

  let gridIndices:number[][] = xrange(size[1]).map(i => 
    xrange(size[0]).map(
      j => j + size[0]*i
    )
  );

  const IsMatch = (objectOne:string|null, objectTwo:string|null) => {
    if (objectOne != null && objectTwo != null) {
      if (objectOne === objectTwo) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // Iterates through each row to look for a match.
  const CheckVerticalForMatch = ():number[][][] => {
    // Store the array of matches
    let matches:number[][][] = [];
    for (var i=0; i<size[0]; i++) {
      let firstIndex:number[] = [i,0];
      let potentialMatch:number[][] = [firstIndex];
      let color:string|null = boardDataSource.current[gridIndices[0][i]]['color'] || null;

      for (var j=0; j<size[1]; j++) {
        // Get the object stored in the next tile. Set to null if the next index is out of range.
        let nextColor:string|null = (j+1)<size[1] ? boardDataSource.current[gridIndices[j+1][i]]['color'] || null :null;

        if (IsMatch(color, nextColor)) {
          potentialMatch.push([i, j+1]);
        } else {
          // Check to see if the potentialMatch is greater than 3.
          if (potentialMatch.length >= 3) {
            matches.push(potentialMatch);
          }
          // Reset the first index.
          firstIndex = [i,j+1];
          potentialMatch = [firstIndex];
          // Reset the current imageObj to that of the next image.
          color = (j+1)<size[1] ? boardDataSource.current[gridIndices[j+1][i]]['color'] || null: null;
        };
      };
    };
    return matches;
  }

  // Iterates through each row to look for a match.
  const CheckHorizontalForMatch = ():number[][][] => {
    // Store the array of matches
    let matches:number[][][] = [];
    for (var j=0; j<size[1]; j++) {
      let firstIndex:number[] = [0,j];
      let potentialMatch:number[][] = [firstIndex];
      let color:string|null = boardDataSource.current[gridIndices[j][0]]['color'] || null;

      for (var i=0; i<size[0]; i++) {
        // Get the object stored in the next tile. Set to null if the next index is out of range.
        let nextColor:string|null = (i+1)<size[0] ? boardDataSource.current[gridIndices[j][i+1]]['color'] || null: null;

        if (IsMatch(color, nextColor)) {
          potentialMatch.push([i+1, j]);
        } else {
          // Check to see if the potentialMatch is greater than 3.
          if (potentialMatch.length >= 3) {
            matches.push(potentialMatch);
          }
          // Reset the first index.
          firstIndex = [i+1,j];
          potentialMatch = [firstIndex];
          // Reset the current imageObj to that of the next image.
          color = (i+1)<size[0] ? boardDataSource.current[gridIndices[j][i+1]]['color'] || null: null;
        };
      };
    };
    return matches
  }

  const IndexMatches = (matches:number[][][]) => {
    let matchedIndices:number[] = [];
    matches.map((match:number[][]) => {
      return match.filter(
        (coordinate:number[]) => {
          if (0 <= coordinate[0] && coordinate[0] < size[0] && 0 <= coordinate[1] && coordinate[1] < size[1]) {
            return true;
          }
          return false;
        }
      ).map(
        (coordinate:number[]) => {
          return matchedIndices.push(gridIndices[coordinate[1]][coordinate[0]]);
        }
      );
    });
    return [...new Set(matchedIndices)];
  }

  const CombineMatches = (matches: number[][][]) => {
    const matchCombined:Object = {};
    const matchCoordinates:Object = {};
    matches.forEach((coordinates, i) => {
      coordinates.forEach((coordinate) => {
        const gridIndex = gridIndices[coordinate[1]][coordinate[0]];
        if (!Object.keys(matchCombined).includes(i.toString())) {
          matchCombined[i] = [];
        }
        matchCombined[i].push(gridIndex);
        
        if (Object.keys(matchCoordinates).includes(gridIndex.toString())) {
          const oldMatchIndex = matchCoordinates[gridIndex];
          if(oldMatchIndex !== i) {
            matchCombined[oldMatchIndex].forEach((m) => {
              matchCombined[i].push(m);
              matchCoordinates[JSON.stringify(m)] = i;
            });
            delete matchCombined[oldMatchIndex];
          }
        } else {
          matchCoordinates[gridIndex] = i;
        }
        matchCombined[i] = Array.from(new Set(matchCombined[i]));
      });
    });

    const matchCache:number[][][] = [];
    Object.keys(matchCombined).forEach((m) => {
      matchCache.push(matchCombined[m].map((index) => {
        return CoordinateFromIndex(+index, size[0])
      }));
    });
    return matchCache;
  }

  /** @params (number[][])
   *  forcedMatch is an array of number arrays, with each internal array being a coordinate to force to match
   */
  const CheckForMatch = (forcedMatch?:number[][][]) => {
    let matches:number[][][] = CombineMatches([
      ...CheckVerticalForMatch(),
      ...CheckHorizontalForMatch(),
    ]);
    if (forcedMatch) {
      matches = [
        ...matches,
        ...forcedMatch
      ]
    };

    if (matchIndices.length === 0) {
      if (matches.length > 0) {
        let newSpecialSpawn:{[index:number]:number} = {};
        let newTranslate:(number|undefined)[][] = Array.from({length:indices.length}, () => [0, 0]);
        matches.forEach((match) => {
          match.forEach((coordinate) => {
            if (0 <= coordinate[0] && coordinate[0] < size[0] && 0 <= coordinate[1] && coordinate[1] < size[1] ) {
              // Trigger specials that are activated by other specials.
              const tileIndex = gridIndices[coordinate[1]][coordinate[0]];
              console.log("Add", boardDataSource.current[tileIndex]['score'])
              setScore(boardDataSource.current[tileIndex]['score']);
              boardDataSource.current[tileIndex]['score'] = 0;
              if (boardDataSource.current[tileIndex]['type'] === 'special' && 
                  boardDataSource.current[tileIndex]['power'] > 0) {
                const activatedPower = boardDataSource.current[tileIndex]['power'];
                boardDataSource.current[tileIndex]['power'] = 0;
                TriggerInteract(tileIndex, activatedPower);
                TriggerTileEffect(tileIndex, boardDataSource.current[tileIndex]['interactType'], activatedPower)
              };
            };
          })
          let matchType = SPECIALS.NONE;
          // Calculate coordinate from index.
          let centerCoordinates = [
            CoordinateFromIndex(lastInteraction.current[0], size[0]),
            CoordinateFromIndex(lastInteraction.current[1], size[0]),
          ];
          let defaultCenterCoordinate = match[Math.floor(match.length/2)]
          if (match.length === 4) {
            // Create rocket
            if (match.every((val:number[], i:number, arr:number[][]) => val[0] === arr[0][0])) { 
              // All y-coordinates are the same
              matchType = SPECIALS.ROCKET_HORIZONTAL;
            } else if (match.every((val:number[], i:number, arr:number[][]) => val[1] === arr[0][1])) {
              // All x-coordinates are the same
              matchType = SPECIALS.ROCKET_VERTICAL;
            };
          } else if (match.length > 4) {
            if (match.every((val:number[], i:number, arr:number[][]) => val[0] === arr[0][0]) ||
                match.every((val:number[], i:number, arr:number[][]) => val[1] === arr[0][1])) {
              // Matches are on the same axis
              matchType = SPECIALS.CTRL_F;
            } else {
              matchType = SPECIALS.BOMB;
            };
          };

          if (match.some((coordinate) => JSON.stringify(coordinate) === JSON.stringify(centerCoordinates[1]))) {
            defaultCenterCoordinate = centerCoordinates[1];
          } else if (match.some((coordinate:number[]) => JSON.stringify(coordinate) === JSON.stringify(centerCoordinates[0]))) {
            defaultCenterCoordinate = centerCoordinates[0];
          }
          
          if (matchType !== SPECIALS.NONE) {
            newSpecialSpawn[gridIndices[defaultCenterCoordinate[1]][defaultCenterCoordinate[0]]] = matchType;
            match.forEach((m:number[]) => {
              newTranslate[gridIndices[m[1]][m[0]]] = [defaultCenterCoordinate[0] - m[0], defaultCenterCoordinate[1] - m[1], TRANSLATE_MODES.FROM_0]
            })
          };
        });
        specialSpawn.current = newSpecialSpawn;

        setDelay(Array(indices.length).fill(0));
        setMatchIndices(m => [...m, ...IndexMatches(matches)]);
        setTranslate(newTranslate);
        setInteractionIndex(-1);
        return true
      } else {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
        setInteractionIndex(-1);
        CheckForMoves();
        return false
      }
    }
  }

  const CheckForPlayerMatch = () => {
    if (matchIndices.length === 0) {
      interactionState.current = INTERACTION_STATES.ANIMATING;
      CheckForMatch();
      setInteractionIndex(-1);
    }
  }

  let refillIndices:number[] = [];
  const CheckForRefill = (id:number) => {
    refillIndices.push(id);
    if (JSON.stringify(Array.from(new Set(matchIndices)).sort()) === JSON.stringify(Array.from(new Set(refillIndices)).sort())) {
      // Get each BlankTile and recursively get the Tile above it.
      let newTranslate:(number|undefined)[][] = Array.from({length:indices.length}, () => [0, 0]);
      const newBoard = boardDataSource.current.slice(0);
      const newRedraws:number[] = [];
      const newAnimationEffect:[string, number][] = animationEffect.slice(0);
      refillIndices.forEach((i) => {
        if (Object.keys(specialSpawn.current).includes(i.toString())) {
          const specialType = specialSpawn.current[i];
          newBoard[i] = Special({interactType: specialType, power: specials[specialType].power, score: scoreList['SPECIAL'][specialType]});
          newAnimationEffect[i] = [ANIMATION_EFFECTS.CREATE_SPECIAL, 0];
        } else {
          newBoard[i] = BlankTile();
        }
      });
      for (var i=newBoard.length-1; i>=0; i--) {
        if (newBoard[i].type === "blank") {
          newRedraws.push(i);
          const [newTile, newTileIndex] = GetTileAbove(newBoard, i);
          newBoard[i] = newTile;
          newTranslate[i][1] = (newTileIndex - i)/size[0];
          if (newTileIndex >= 0) {
            newBoard[newTileIndex] = BlankTile();
            newRedraws.push(newTileIndex)
          };
        };
      };
      indices.forEach((i) => {
        if (newBoard[i].type === "blank" && bag.length > 0)
          {
            const randomMatchable:number = Math.floor(Math.random()*bag.length)
            newBoard[i] = structuredClone(bag[randomMatchable]);
            newTranslate[i][0] = undefined; // Signals to the Matchable that it should use the dropInDown animation.
          }
      });
      boardDataSource.current = newBoard;
      lastInteraction.current = [-1, -1];
      setAnimationEffect(newAnimationEffect);
      setTranslate(newTranslate);
      setRedrawTiles([...new Set(newRedraws)]);
      setMatchIndices([])
      setDelay(Array(indices.length).fill(0));
    };
  };

  let redrawIndices = useRef(new Set<number>([]));
  const CheckForRedraw = (id:number) => {
    redrawIndices.current.add(id);
    if (JSON.stringify(Array.from(new Set(redrawTiles)).sort()) === JSON.stringify(Array.from(redrawIndices.current).sort())) {
      redrawIndices.current = new Set<number>([]);
      setRedrawTiles([]);
      setTranslate(Array.from({length:indices.length}, () => [0, 0]));
      setDelay(Array(indices.length).fill((4-gameSpeed)/8))
      if (interactionState.current === INTERACTION_STATES.NO_MATCH_AFTER_FALLING) {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
      } else if (interactionState.current === INTERACTION_STATES.ANIMATING) {
        let specialTriggered = false;
        if (JSON.stringify(lastInteraction.current) !== '[-1,-1]') {
          if (boardDataSource.current[lastInteraction.current[0]]['type'] === 'special') {
            specialTriggered = TriggerInteract(lastInteraction.current[0], boardDataSource.current[lastInteraction.current[0]]['power']);
            setInteractionIndex(-1);
          }
          if (boardDataSource.current[lastInteraction.current[1]]['type'] === 'special') {
            specialTriggered = TriggerInteract(lastInteraction.current[1], boardDataSource.current[lastInteraction.current[1]]['power']);
            setInteractionIndex(-1);
          }
        };
        if (!specialTriggered) {
          CheckForMatch();
        };
        CheckForScore();
      };
    }
  }

  const GetTileAbove = (board:ItemType[], i:number):[ItemType, number]=> {
    const aboveTile = i-size[0]>=0 ? board[i-size[0]] : null;
    if (aboveTile === null) {
      return [BlankTile(), i-size[0]];
    } else {
      if (MovableType.includes(aboveTile.type)) {
        return [aboveTile, i-size[0]];
      } else {
        return GetTileAbove(board, i-size[0]);
      };
    };
  };

  const interactPosition = useRef([0, 0])
  const Interact = (params?: {i:number, e: React.MouseEvent}):number => {
    if (params) {
      if (interactionState.current === INTERACTION_STATES.AVAILABLE) {
        interactionState.current = INTERACTION_STATES.INTERACTING;
        setTranslateDrag([0, 0]);
        const targetElement = params.e.nativeEvent.target as Element;
        const targetBox = targetElement.getBoundingClientRect();
        tileWidth.current = targetBox.width;
        interactPosition.current = [
          targetBox.x + targetBox.width/2,
          targetBox.y + targetBox.height/2
        ];
        setInteractionIndex(params.i);
      };
    };
    return interactionIndex
  }

  const SwapIndices = (swapIndex: number) => {
    if (interactionState.current !== INTERACTION_STATES.ANIMATING) return;
    const newBoardDataSource = boardDataSource.current.slice(0);
    const newIndex = interactionIndex + swapIndex;
    if (newIndex < 0 || newIndex > indices.length) return false;
    if (Math.abs((newIndex % size[0]) - (interactionIndex % size[0])) >= (size[0]-1)) return false;
    // Change internal board data
    newBoardDataSource[newIndex] = boardDataSource.current[interactionIndex];
    newBoardDataSource[interactionIndex] = boardDataSource.current[newIndex];
    swapped.current = true;
    setMoves(-1);
    boardDataSource.current = newBoardDataSource;

    // Change translate state to tell children objects to transform.
    const newTranslate = translate.slice(0);
    switch (newIndex) {
      case interactionIndex - 1:
        newTranslate[interactionIndex] = [ -1,  0,  TRANSLATE_MODES.TO_0];
        newTranslate[newIndex]         = [  1,  0,  TRANSLATE_MODES.TO_0];
        break;
      case interactionIndex + 1:
        newTranslate[interactionIndex] = [  1,  0,  TRANSLATE_MODES.TO_0];
        newTranslate[newIndex]         = [ -1,  0,  TRANSLATE_MODES.TO_0];
        break;
      case interactionIndex - size[0]:
        newTranslate[interactionIndex] = [  0, -1,  TRANSLATE_MODES.TO_0];
        newTranslate[newIndex]         = [  0,  1,  TRANSLATE_MODES.TO_0];
        break;
      case interactionIndex + size[0]:
        newTranslate[interactionIndex] = [  0,  1,  TRANSLATE_MODES.TO_0];
        newTranslate[newIndex]         = [  0, -1,  TRANSLATE_MODES.TO_0];
        break;
      default:
        newTranslate[interactionIndex] = [  0,  0,  TRANSLATE_MODES.TO_0];
        newTranslate[newIndex]         = [  0,  0,  TRANSLATE_MODES.TO_0];
        break;
    };
    setTranslate(newTranslate);
    setRedrawTiles([interactionIndex, newIndex]);
    lastInteraction.current = [interactionIndex, newIndex];
    ReleaseInteract();
    setInteractionIndex(-1);
    CheckForMoves();
    return true;
  }
  
  const MoveInteract = (e:React.MouseEvent):void => {
    if (interactionIndex < 0 || interactionState.current === INTERACTION_STATES.ANIMATING) return;
    if (interactionState.current === INTERACTION_STATES.AVAILABLE) {
      interactionState.current = INTERACTION_STATES.INTERACTING;
    }
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
      if (bulletTime) {
        // Initiate countdown for bullet time and anchor matchable to the mouse.
      } else {
        const tolerance:number = tileWidth.current * .15;
        const toleranceMultiplier:number = 5;
        const offsetX:number = e.pageX - interactPosition.current[0];
        const offsetY:number = e.pageY - interactPosition.current[1];
        if (Math.abs(offsetX) > Math.abs(offsetY)) {
          if (Math.abs(offsetX) >= toleranceMultiplier*tolerance) {
            const swapIndex = offsetX > 0 ? 1 : -1;
            interactionState.current = INTERACTION_STATES.ANIMATING;
            SwapIndices(swapIndex);
            return;
          } else if (tolerance < Math.abs(offsetX)) {
            if (translateDrag[1] === 0) return setTranslateDrag([offsetX>0?1:-1, 0, TRANSLATE_MODES.EASE_IN]);
          };
        } else if (Math.abs(offsetY) >= Math.abs(offsetX)) {
          if (Math.abs(offsetY) > toleranceMultiplier*tolerance) {
            const swapIndex = offsetY > 0 ? size[0] : -size[0];
            interactionState.current = INTERACTION_STATES.ANIMATING;
            SwapIndices(swapIndex);
            return;
          } else if (tolerance < Math.abs(offsetY)) {
            if (translateDrag[0] === 0) return setTranslateDrag([0, offsetY>0?1:-1, TRANSLATE_MODES.EASE_IN]);
          };
        }
        return setTranslateDrag([0, 0]);
      };
    };
  };

  const ReleaseInteract = () => {
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
      if (boardDataSource.current[interactionIndex].type === "special") {
        interactionState.current = INTERACTION_STATES.RELEASE_INPUT;
        TriggerInteract(interactionIndex, boardDataSource.current[interactionIndex]['power']);
        return;
      }
      if (swapped.current) {
        swapped.current = false;
        interactionState.current = INTERACTION_STATES.RELEASE_INPUT;
        return CheckForPlayerMatch();
      } else {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
        setInteractionIndex(-1);
      };
    };
  }

  const RevertInteract = () => {
    setInteractionIndex(-1);
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
      interactionState.current = INTERACTION_STATES.AVAILABLE;
    }
  };

  const TriggerTileEffect = (id:number, animation_effect:string, power:number):void => {
    setAnimationEffect((a) => [
      ...a.slice(0, id), 
      [animation_effect, power], 
      ...a.slice(id+1)
    ]);
  };

  const TriggerInteract = (index: number, power:number):boolean => {
    console.log(`Performing ${boardDataSource.current[index].type} at ${index} with power ${power}.`);
    if ("interactType" in boardDataSource.current[index] )
      {
        const interactType = boardDataSource.current[index]['interactType'];
        if (!Object.values(SPECIALS).includes(interactType)) return false;
        const specialCoordinate = CoordinateFromIndex(index, size[0]);
        interactionState.current = INTERACTION_STATES.ANIMATING;
        const affectedCoordinates:number[][][] = [];
        var i:number;
        var j:number;
        switch(interactType) {
          case SPECIALS.ROCKET_HORIZONTAL:
            for (i=-power; i<=power; i++) {
              const affectedCoordinate = specialCoordinate[0] + i;
              if (0 <= affectedCoordinate && affectedCoordinate < size[0]) {
                affectedCoordinates.push([[affectedCoordinate, specialCoordinate[1]]]);
              }
            };
            CheckForMatch(affectedCoordinates);
            break;
          case SPECIALS.ROCKET_VERTICAL:
            for (i=-power; i<=power; i++) {
              const affectedCoordinate = specialCoordinate[1] + i;
              if (0 <= affectedCoordinate && affectedCoordinate < size[1]) {
                affectedCoordinates.push([[specialCoordinate[0], affectedCoordinate]]);
              }
            };
            CheckForMatch(affectedCoordinates);
            break;
          case SPECIALS.BOMB:
            for (i=-power; i<=power; i++) {
              for (j=-power; j<=power; j++) {
              const affectedCoordinate = [specialCoordinate[0] + i, specialCoordinate[1] + j];
                if (0 <= affectedCoordinate[0] && affectedCoordinate[0] < size[0] && 
                    0 <= affectedCoordinate[1] && affectedCoordinate[1] < size[1]) {
                  affectedCoordinates.push([affectedCoordinate]);
                }
              }
            };
            CheckForMatch(affectedCoordinates);
            break;
          case SPECIALS.CTRL_A:
            console.log("KABOOOOOOM.");
            break;
          case SPECIALS.CTRL_F:
            console.log("Kaboom.");
            break;
        };
        setInteractionIndex(-1);
        return true;
      }
    return false;
  }

  const ManageChildComponent = (functionName:string, id?:number) => {
    if (id !== undefined) {
      switch(functionName) {
        case 'refill':
          return CheckForRefill(id);
        case 'redraw':
          return CheckForRedraw(id);
        case 'special':
          if (Object.keys(specialSpawn.current).includes(id.toString())) {
            return specialSpawn.current[id.toString()]
          }
          return 0
        default:
          throw new Error('Missing ID');
      }
    } else {
      switch(functionName) {
        case 'matches':
          return matchIndices;
        case 'redraw':
          return redrawTiles;
        case 'translate':
          return translate;
        case 'interact':
          return Interact;
        case 'interactState':
          return interactionState.current === INTERACTION_STATES.INTERACTING;
        case 'translateDrag':
          return translateDrag;
        case 'tileEffect':
          return TriggerTileEffect;
        default:
          throw new Error('Function name not found.');
      }
      
    }
  }
  const className = `animate__animated
  ${boardProps.playable? ' animate__bounceInLeft': ' animate__bounceOutLeft'}
  ${boardProps.gameOver? ' animate__hinge': ''}`;

  return (
    <div 
      id='board'
      className={className}
      style={
        {
          gridTemplateColumns: `repeat(${size[0]}, ${size[0] <= size[1]? "auto": "1fr"})`,
          gridTemplateRows: `repeat(${size[1]}, ${size[0] > size[1]? "auto": "1fr"})`,
          margin: `${size[0] > size[1] ? (50*((size[0]-1)/size[1])-50)/(1.147*((size[0]-1)/size[1])): 0}% 0`// ${size[0] > size[1] ? size[1]*3: 0}%`
        } as CSSProperties
      }
      onMouseUp = {ReleaseInteract}
      onMouseLeave = {RevertInteract}
      onMouseMove = {(e:React.MouseEvent) => MoveInteract(e)}
      >
       {boardDataSource.current.map(function(item:ItemType, index) {
        if (item.type !== 'blank') {
          const matchableImageProps:MatchableImageProps = {
            id: index,
            delay: delay,
            animationSpeed: CalculateAnimationSpeed(gameSpeed),
            manager: ManageChildComponent,
            boardDataSource: boardDataSource.current,
          }
          return (
            <div className='tile' key={index}>
              <TileEffect id={index} animationEffect={animationEffect} manager={ManageChildComponent}/>
              <MatchableImage  {...matchableImageProps} />
            </div>
          );
        };
        const blankTileProps:BlankTileProps = {
          id: index, 
          redrawTiles: redrawTiles, 
          translate: translate, 
          manager:ManageChildComponent
        };
        return (
          <div className='tile'  key={index}>
            <BlankTileImage{...blankTileProps} />
          </div>)
      })}
    </div>
  );
};

export default Board;
