import * as React from 'react';
import './Board.css';
import { useEffect, useRef, useState, CSSProperties } from 'react';
import { BlankTile, BlankTileImage, BlankTileProps } from './BlankTile.tsx';
import { Marble, MarbleType, MarbleImage, MarbleImageProps } from './Marble.tsx';
import { CalculateAnimationSpeed, CoordinateFromIndex, xrange } from '../lib/GridApi.tsx';
import { INTERACTION_STATES, SPECIALS } from '../lib/Constants.tsx';
import { ItemType } from '../App.tsx';

interface BoardProps {
  size: [number, number],
  gameSpeed: number,
  bag: ItemType[],
  initialBoard: ItemType[],
  bulletTime: boolean,
};

const Board = (BoardProps: BoardProps) => {
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [animation, setAnimation] = useState<string>('animate__bounceInDown');

  const interactionState = useRef<number>(INTERACTION_STATES.NO_MATCH_AFTER_FALLING);
  const boardDataSource = useRef<ItemType[]>(BoardProps.initialBoard);
  const [interactionIndex, setInteractionIndex] = useState<number>(-1);
  

  const size:number[] = BoardProps.size;
  const gameSpeed:number = BoardProps.gameSpeed;
  const bag:ItemType[] = BoardProps.bag;
  const bulletTime:boolean = BoardProps.bulletTime

  let indices:number[] = xrange(size[0] * size[1]);
  const [delay, setDelay] = useState<number[]>(
    indices.map(index => {
      return (Math.random() + (indices.length - index - 1)/(size[1]))/(4+4*gameSpeed);
    })
  )
  
  const [redrawTiles, setRedrawTiles] = useState<number[]>(indices.slice(0));
  const [translate, setTranslate] = useState<(number|undefined)[][]>(Array.from({length:indices.length}, () => [0, 0]));
  const [translateDrag, setTranslateDrag] = useState<number[]>([0, 0])

  const swapped = useRef<boolean>(false);
  const tileWidth = useRef<number>(0);
  const specialSpawn = useRef<{[index: number]: number}>({});
  const lastInteraction = useRef<number[]>([-1, -1]);

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
        }
      }
    }
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
        }
      }
    }
    return matches
  }

  const IndexMatches = (matches:number[][][]) => {
    let matchedIndices:number[] = [];
    matches.map((match:number[][]) => {
      return match.map((matchCoordinate:number[]) => {
        return matchedIndices.push(gridIndices[matchCoordinate[1]][matchCoordinate[0]]);
      });
    });
    return [...new Set(matchedIndices)];
  }

  const CombineMatches = (matches: number[][][]) => {
    const matchCombined:Object = {};
    matches.forEach((coordinates, i) => {
      coordinates.forEach((coordinate) => {
        if (Object.keys(matchCombined).includes(JSON.stringify(coordinate))) {
          i = matchCombined[JSON.stringify(coordinate)];
        }
      });
      coordinates.forEach((coordinate) => {
        matchCombined[JSON.stringify(coordinate)] = i
      });
    });

    const matchCache:Object = {};
    Object.keys(matchCombined).forEach((m) => {
      const i = matchCombined[m];
      if (typeof matchCache[i] === 'undefined') {
        matchCache[i] = [];
      };
      matchCache[i].push(JSON.parse(m));
    })
    return Object.values(matchCache);
  }

  /** @params (number[][])
   *  forcedMatch is an array of number arrays, with each internal array being a coordinate to force to match
   */
  const CheckForMatch = (forcedMatch?:number[][]) => {
    let matches = CombineMatches([
      ...CheckVerticalForMatch(),
      ...CheckHorizontalForMatch(),
    ]);

    if (forcedMatch) {
      matches = [
        ...matches,
        ...forcedMatch
      ]
    }

    console.log(matches);

    if (matchIndices.length === 0) {
      if (matches.length > 0) {
        let newSpecialSpawn:{[index:number]:number} = {};
        matches.forEach((match) => {
          let matchType = SPECIALS.NONE;
          // Calculate coordinate from index.
          let centerCoordinates = [
            CoordinateFromIndex(lastInteraction.current[0], size[1]),
            CoordinateFromIndex(lastInteraction.current[1], size[1]),
          ];
          let defaultCenterCoordinate = match[Math.floor(match.length/2)]
          if (match.length === 4) {
            // Create rocket
            if (match.every((val:number[], i:number, arr:number[][]) => val[0] === arr[0][0])) { 
              // All x-coordinates are the same
              matchType = SPECIALS.ROCKET_VERTICAL;
            } else if (match.every((val:number[], i:number, arr:number[][]) => val[1] === arr[0][1])) {
              // All y-coordinates are the same
              matchType = SPECIALS.ROCKET_HORIZONTAL;
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

          if (match.some((coordinate) => JSON.stringify(coordinate) === JSON.stringify(centerCoordinates[0]))) {
            defaultCenterCoordinate = centerCoordinates[0];
          } else if (match.some((coordinate) => JSON.stringify(coordinate) === JSON.stringify(centerCoordinates[1]))) {
            defaultCenterCoordinate = centerCoordinates[1];
          } 
          if (matchType !== SPECIALS.NONE) {
            newSpecialSpawn[gridIndices[defaultCenterCoordinate[1]][defaultCenterCoordinate[0]]] = matchType;
          };
        })
        lastInteraction.current = [-1, -1];
        specialSpawn.current = newSpecialSpawn;
        setDelay(Array(indices.length).fill(0));
        setAnimation("animate__bounceOutDown");
        setMatchIndices(IndexMatches(matches));
        setInteractionIndex(-1);
        return true
      } else {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
        setInteractionIndex(-1);
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
    console.log("Refill")
    if (JSON.stringify(matchIndices.sort()) === JSON.stringify(refillIndices.sort())) {
      // Get each BlankTile and recursively get the Tile above it.
      
      let newTranslate:(number|undefined)[][] = Array.from({length:indices.length}, () => [0, 0]);
      const newBoard = boardDataSource.current.slice(0);
      const newRedraws:number[] = [];
      refillIndices.forEach((i) => {
        if (Object.keys(specialSpawn.current).includes(i.toString())) {
          newBoard[i] = Marble({color: ['black', 'white', 'cyan', 'gray', 'magenta'][specialSpawn.current[i]]});
        } else {
          newBoard[i] = BlankTile();
        }
      });
      for (var i=newBoard.length-1; i>=0; i--) {
        if (newBoard[i].type === "blank") {
          newRedraws.push(i);
          const [newTile, newTileIndex] = GetTileAbove(newBoard, i);
          newBoard[i] = newTile;
          newTranslate[i][1] = (newTileIndex - i)/size[1];
          if (newTileIndex >= 0) {
            newBoard[newTileIndex] = BlankTile();
            newRedraws.push(newTileIndex)
          };
        };
      };
      indices.forEach((i) => {
        if (newBoard[i].type === "blank" && bag.length > 0)
          {
            const randomMarble:number = Math.floor(Math.random()*bag.length)
            newBoard[i] = bag[randomMarble];
            newTranslate[i][0] = undefined; // Signals to the Marble that it should use the dropInDown animation.
          }
      });
      boardDataSource.current = newBoard;
      setTranslate(newTranslate)
      setAnimation("animate-refill")
      setRedrawTiles([...new Set(newRedraws)]);
      setMatchIndices([])
      setDelay(Array(indices.length).fill(0))
    };
  };

  let redrawIndices = useRef(new Set<number>([]));
  const CheckForRedraw = (id:number) => {
    redrawIndices.current.add(id);
    if (JSON.stringify(redrawTiles.sort()) === JSON.stringify(Array.from(redrawIndices.current).sort())) {
      redrawIndices.current = new Set<number>([]);
      setRedrawTiles([]);
      setTranslate(Array.from({length:indices.length}, () => [0, 0]));
      setDelay(Array(indices.length).fill((4-gameSpeed)/8))
      if (interactionState.current === INTERACTION_STATES.NO_MATCH_AFTER_FALLING) {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
      } else if (interactionState.current === INTERACTION_STATES.ANIMATING) {
        CheckForMatch();
      };
    }
  }

  const translatedIndices:(number)[] = translate.reduce(function(a:number[], e:(number | undefined)[], i:number) {
    if (e[1]) {
      if (e[1] !== 0) {
        a.push(i);
      }
    }
    return a;
  }, [])
  
  let animateRefillIndices = new Set<number>([]);
  const CheckForAnimateRefill = (id:number) => {
    animateRefillIndices.add(id);
    if (JSON.stringify(translatedIndices.sort()) === JSON.stringify([...animateRefillIndices].sort())) {
      interactionState.current = INTERACTION_STATES.ANIMATING;
      setRedrawTiles([]);
      setTranslate(Array.from({length:indices.length}, () => [0, 0]));
      CheckForMatch();
    }
  }

  const GetTileAbove = (board:ItemType[], i:number):[ItemType, number]=> {
    const aboveTile = i-size[1]>=0 ? board[i-size[1]] : null;
    if (aboveTile === null) {
      return [BlankTile(), i-size[1]];
    } else {
      if (aboveTile.type === "marble") {
        return [aboveTile, i-size[1]];
      } else {
        return GetTileAbove(board, i-size[1]);
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
      }
    }
    return interactionIndex
  }

  const SwapIndices = (swapIndex: number) => {
    if (interactionState.current !== INTERACTION_STATES.ANIMATING) return
    const newBoardDataSource = boardDataSource.current.slice(0);
    const newIndex = interactionIndex + swapIndex;
    if (newIndex < 0 || newIndex > indices.length) return false
    if (Math.abs((newIndex % size[1]) - (interactionIndex % size[1])) >= (size[1]-1)) return false
    // Change internal board data
    newBoardDataSource[newIndex] = boardDataSource.current[interactionIndex];
    newBoardDataSource[interactionIndex] = boardDataSource.current[newIndex];
    swapped.current = true;
    boardDataSource.current = newBoardDataSource;

    // Change translate state to tell children objects to transform.
    const newTranslate = translate.slice(0);
    switch (newIndex) {
      case interactionIndex - 1:
        newTranslate[interactionIndex] = [ -1.1,    0];
        newTranslate[newIndex]         = [    1,    0];
        break;
      case interactionIndex + 1:
        newTranslate[interactionIndex] = [    1,    0];
        newTranslate[newIndex]         = [ -1.1,    0];
        break;
      case interactionIndex - size[1]:
        newTranslate[interactionIndex] = [    0, -1.1];
        newTranslate[newIndex]         = [    0,    1];
        break;
      case interactionIndex + size[1]:
        newTranslate[interactionIndex] = [    0,    1];
        newTranslate[newIndex]         = [    0, -1.1];
        break;
      default:
        newTranslate[interactionIndex] = [    0,    0];
        newTranslate[newIndex]         = [    0,    0];
        break;
    }
    setTranslate(newTranslate);
    setRedrawTiles([interactionIndex, newIndex]);
    lastInteraction.current = [interactionIndex, newIndex];
    setInteractionIndex(-1)
    ReleaseInteract();
    return true
  }
  
  const MoveInteract = (e:React.MouseEvent):void => {
    if (interactionIndex < 0 || interactionState.current === INTERACTION_STATES.ANIMATING) return
    if (interactionState.current === INTERACTION_STATES.AVAILABLE) {
      interactionState.current = INTERACTION_STATES.INTERACTING;
    }
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
      if (bulletTime) {
        // Initiate countdown for bullet time and anchor marble to the mouse.
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
            if (translateDrag[1] === 0) return setTranslateDrag([offsetX>0?1:-1, 0]);
          };
        } else if (Math.abs(offsetY) >= Math.abs(offsetX)) {
          if (Math.abs(offsetY) > toleranceMultiplier*tolerance) {
            const swapIndex = offsetY > 0 ? size[1] : -size[1];
            interactionState.current = INTERACTION_STATES.ANIMATING;
            SwapIndices(swapIndex);
            return;
          } else if (tolerance < Math.abs(offsetY)) {
            if (translateDrag[0] === 0) return setTranslateDrag([0, offsetY>0?1:-1]);
          };
        }
        return setTranslateDrag([0, 0]);
      };
    };
  };

  const ReleaseInteract = () => {
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
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
  }

  const ManageChildComponent = (functionName:string, id?:number) => {
    if (id !== undefined) {
      switch(functionName) {
        case 'refill':
          return CheckForRefill(id);
        case 'redraw':
          return CheckForRedraw(id);
        case 'animateRefill':
          return CheckForAnimateRefill(id);
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
        default:
          throw new Error('Function name not found.');
      }
      
    }
  }

  return (
    <div id='board' 
      style={
        {
          gridTemplateColumns: `repeat(${size[0]}, auto)`,
          gridTemplateRows: `repeat(${size[1]}, auto)`
        } as CSSProperties
      }
      onMouseUp = {ReleaseInteract}
      onMouseLeave = {RevertInteract}
      onMouseMove = {(e:React.MouseEvent) => MoveInteract(e)}
      >
       {boardDataSource.current.map(function(item:ItemType, index) {
        if (item.type === 'marble') {
          const marbleImageProps:MarbleImageProps = {
            id: index,
            delay: delay,
            animationSpeed: CalculateAnimationSpeed(gameSpeed),
            animation: animation,
            manager: ManageChildComponent,
            boardDataSource: boardDataSource.current,
          }
          return <MarbleImage key={index} {...marbleImageProps} />
        }
        const blankTileProps:BlankTileProps = {
          id: index, 
          redrawTiles: redrawTiles, 
          translate: translate,
          manager:ManageChildComponent
        }
        return <BlankTileImage key={index} {...blankTileProps}   />
      })}
    </div>
  );
};

export default Board;
