import * as React from 'react';
import './Board.css';
import { useRef, useState, CSSProperties } from 'react';
import { BlankTile, BlankTileImage, BlankTileProps } from './BlankTile.tsx';
import { MarbleImage, MarbleImageProps } from './Marble.tsx';
import { CalculateAnimationSpeed, ConvertRemToPixels, xrange } from '../lib/GridApi.tsx';
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
  const [boardDataSource, setBoardDataSource] = useState<ItemType[]>(BoardProps.initialBoard);
  const [animation, setAnimation] = useState<string>('animate__bounceInDown');

  /** @const {string: number}  
   *  NO_MATCH_AFTER_FALLING: start of board. no matching after falling.  
   *  RELEASE: release interactionState. close to interactionState.  
   *  ANIMATING: any interactionState. closed to interactionState. animating images  
   *  AVAILABLE: no interactionState. open to interactionState  
   *  INTERACTING: interacting with index
   */
  const INTERACTION_STATES = {
    NO_MATCH_AFTER_FALLING: 0,
    RELEASE_INPUT: 1,
    ANIMATING: 2,
    AVAILABLE: 3,
    INTERACTING: 4
  }
  const interactionState = useRef<number>(INTERACTION_STATES.NO_MATCH_AFTER_FALLING);
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
      let color:string|null = boardDataSource[gridIndices[0][i]]['color'] || null;

      for (var j=0; j<size[1]; j++) {
        // Get the object stored in the next tile. Set to null if the next index is out of range.
        let nextColor:string|null = (j+1)<size[1] ? boardDataSource[gridIndices[j+1][i]]['color'] || null :null;

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
          color = (j+1)<size[1] ? boardDataSource[gridIndices[j+1][i]]['color'] || null: null;
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
      let color:string|null = boardDataSource[gridIndices[j][0]]['color'] || null;

      for (var i=0; i<size[0]; i++) {
        // Get the object stored in the next tile. Set to null if the next index is out of range.
        let nextColor:string|null = (i+1)<size[0] ? boardDataSource[gridIndices[j][i+1]]['color'] || null: null;

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
          color = (i+1)<size[0] ? boardDataSource[gridIndices[j][i+1]]['color'] || null: null;
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

  const CheckForMatch = () => {
    const matches = [
      ...CheckVerticalForMatch(),
      ...CheckHorizontalForMatch()
    ];

    if (matchIndices.length === 0) {
      if (matches.length > 0) {
        setDelay(Array(indices.length).fill(0));
        setAnimation("animate__bounceOutDown");
        setMatchIndices(IndexMatches(matches));
        return true
      } else {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
        return false
      }
    }
  }

  const CheckForPlayerMatch = () => {
    if (matchIndices.length === 0) {
      interactionState.current = INTERACTION_STATES.ANIMATING;
      CheckForMatch();
    }
  }

  let refillIndices:number[] = [];

  const CheckForRefill = (id:number) => {
    refillIndices.push(id);
    if (JSON.stringify(matchIndices.sort()) === JSON.stringify(refillIndices.sort())) {
      // Get each BlankTile and recursively get the Tile above it.
      
      let newTranslate:(number|undefined)[][] = Array.from({length:indices.length}, () => [0, 0]);
      const newBoard = boardDataSource.slice(0);
      const newRedraws:number[] = [];
      refillIndices.forEach((i) => {
        newBoard[i] = BlankTile();
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
      setBoardDataSource(newBoard);
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
      }
      setInteractionIndex(params.i);
      setTranslateDrag([0, 0]);
      const targetElement = params.e.nativeEvent.target as Element;
      const targetBox = targetElement.getBoundingClientRect();
      tileWidth.current = targetBox.width;
      interactPosition.current = [
        targetBox.x + targetBox.width/2,
        targetBox.y + targetBox.height/2
      ]
    }
    return interactionIndex
  }

  const CheckForSwap = (params: {i:number, e: React.MouseEvent}):boolean => {
    const id = params.i;
    const e = params.e;
    if (indices.includes(interactionIndex) && indices.includes(id) && interactionState.current === INTERACTION_STATES.INTERACTING) {
      
      console.log(`You moved over ${id} and are holding ${interactionIndex} located at ${interactPosition.current}.`);
      const swappableIndices = [
        id - 1,
        id + 1,
        id - size[1],
        id + size[1]
      ];

      if ((swappableIndices.includes(interactionIndex) || bulletTime)) {
        console.log("Eligible move.");
        console.log(e.pageX, e.pageY);
        const newBoardDataSource = boardDataSource.slice(0);
        newBoardDataSource[id] = boardDataSource[interactionIndex];
        newBoardDataSource[interactionIndex] = boardDataSource[id];
        const targetElement = e.nativeEvent.target as Element;
        const targetBox = targetElement.getBoundingClientRect();
        interactPosition.current = [
          targetBox.x + targetBox.width/2,
          targetBox.y + targetBox.height/2
        ]
        setInteractionIndex(id);
        setBoardDataSource(newBoardDataSource);
      };
      return true
    } else {
      return false
    }
  }

  const SwapIndices = (swapIndex: number) => {
    const newBoardDataSource = boardDataSource.slice(0);
    const newIndex = interactionIndex + swapIndex;
    if (newIndex < 0 || newIndex > indices.length) return false
    newBoardDataSource[newIndex] = boardDataSource[interactionIndex];
    newBoardDataSource[interactionIndex] = boardDataSource[newIndex];
    swapped.current = true;
    setBoardDataSource(newBoardDataSource);
    ReleaseInteract();
    return true
  }
  
  const MoveInteract = (e:React.MouseEvent):void => {
    console.log("moving")
    if (interactionIndex < 0 ) return
    if (interactionState.current === INTERACTION_STATES.AVAILABLE) {
      interactionState.current = INTERACTION_STATES.INTERACTING;
    }
    if (bulletTime) {
      // Initiate countdown for bullet time and anchor marble to the mouse.
    } else {
      const targetElement = e.nativeEvent.target as Element;
      const tolerance:number = tileWidth.current * .22;
      

      const offsetX:number = e.pageX - interactPosition.current[0];
      const offsetY:number = e.pageY - interactPosition.current[1];
      if (Math.abs(offsetX) > Math.abs(offsetY)) {
        if (Math.abs(offsetX) > 4*tolerance) {
          const swapIndex = offsetX > 0 ? 1 : -1;
          SwapIndices(swapIndex);
          return
        } else if (tolerance < Math.abs(offsetX)) {
          if (translateDrag[1] === 0) return setTranslateDrag([offsetX>0?1:-1, 0])
        }
      } else if (Math.abs(offsetY) > Math.abs(offsetX)) {
        if (Math.abs(offsetY) > 4*tolerance) {
          const swapIndex = offsetY > 0 ? size[1] : -size[1];
          SwapIndices(swapIndex);
          return
        } else if (tolerance < Math.abs(offsetY)) {
          if (translateDrag[0] === 0) return setTranslateDrag([0, offsetY>0?1:-1])
        }
      } 
      return setTranslateDrag([0, 0])
    }
  }

  const ReleaseInteract = () => {
    if (interactionState.current === INTERACTION_STATES.INTERACTING) {
      if (swapped.current) {
        swapped.current = false;
        interactionState.current = INTERACTION_STATES.RELEASE_INPUT;
        CheckForPlayerMatch();
      } else {
        interactionState.current = INTERACTION_STATES.AVAILABLE;
      };
    };
    setInteractionIndex(-1);
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
        case 'swap':
          return CheckForSwap;
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
       {boardDataSource.map(function(item:ItemType, index) {
        if (item.type === 'marble') {
          const marbleImageProps:MarbleImageProps = {
            id: index,
            delay: delay,
            animationSpeed: CalculateAnimationSpeed(gameSpeed),
            animation: animation,
            manager: ManageChildComponent,
            boardDataSource: boardDataSource,
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
