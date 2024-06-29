import * as React from 'react';
import { useState } from 'react';
import './App.css';
import { Marble, MarbleType } from './components/Marble.tsx';
import { BlankTile, BlankTileType } from './components/BlankTile.tsx';
import { SPECIALS, SPECIALS_POWER, SpecialType } from './components/Special.tsx';
import { COLORS } from './lib/Constants.tsx';
import Board from './components/Board.tsx';
import GameData from './components/GameData.tsx';
import { xrange } from './lib/GridApi.tsx';
var seedrandom = require('seedrandom');

export type ItemType = BlankTileType | MarbleType | SpecialType;

export const MovableType = ["marble", "special"]

interface ScoresParamsType {
  score: number,
  targetScore: number,
  playable: boolean
  gameOver: boolean
}
const Scores = (params:ScoresParamsType):React.JSX.Element => {
  const className = `animate__animated${
    params.playable? ' animate__bounceInLeft': ' animate__bounceOutLeft'} ${
    params.gameOver? ' animate__hinge': ''}`;
  return (
    <div id="scores-container" className={className}>
      <div id="scores">
        <div id='player-score' className='score-display'>
          <span>Score</span>
          <span>{ params.score }</span>
        </div>
        <div id='target-score' className='score-display'>
          <span>Target</span>
          <span>{ params.targetScore }</span>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [score, setScore] = useState<number>(0);
  const [targetScore, setTargetScore] = useState<number>(500);
  const [moves, setMoves] = useState<number>(5);
  const [size, setSize] = useState<[number, number]>([7, 7]);
  const [gameSpeed, setGameSpeed] = useState<number>(2);
  const [seed, setSeed] = useState<string>("dev");
  const [bulletTime, setBulletTime] = useState<boolean>(false);
  const [playable, setPlayable] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [specials, setSpecials] = useState<{[key:number]:{"power": number}}>(
    Object.keys(SPECIALS).reduce((a, i, v) => ({ ...a, [SPECIALS[i]]: {"power": SPECIALS_POWER[i]}}), {}) 
  );
  const [scoreList, setScoreList] = useState({
    DEFAULT: COLORS.reduce((a, i, v)=>({...a, [i]: 10}), {}),
    SPECIAL: Object.values(SPECIALS).reduce((a, i, v)=>({...a, [i]: 100}), {}),
  });

  const [bag, setBag] = useState<MarbleType[]>(
    COLORS.reduce(
      (allMarbles:MarbleType[], color:string) => {
        const coloredMarbles:MarbleType[] = xrange(20).reduce(
          (coloredMarbles:MarbleType[]) => {
            return [...coloredMarbles, Marble({color: color, score: scoreList.DEFAULT[color]})]
          }, []
        )
        return [...allMarbles, ...coloredMarbles]
      }, []
    )
  );
  
  if (seed === "") {
    seedrandom({global: true})
  } else {
    seedrandom(seed, {global: true})
  }

  let indices:number[] = xrange(size[0] * size[1]);
  const initialBoard = (bag:ItemType[]):ItemType[] => {
    // Grid that contains the keys that will be assigned to each tile via map
    const randomizedBag = JSON.parse(JSON.stringify(bag)).sort(() => Math.random() - 0.5);
    var gridData:ItemType[] = indices.map((i:number) => {
        return i<randomizedBag.length ? randomizedBag[i]: BlankTile();
      });
    gridData.reverse();
    return gridData;
  };

  const SetScore = (score:number) => {
    setScore(s => s + score)
  }
  
  const CheckScore = () => {
    console.log("Checking score.");
    if (score >= targetScore) {
      console.log("YOU ARE WINNER");
      return true;
    }
    return false;
  }

  const CheckMoves = () => {
    if (moves === 0) {
      const checkScore = CheckScore();
      if (!checkScore) {
        console.log("GAME OVER");
      }
    }
  }
  
  const SetMoves = (moves:number) => {
    setMoves(m => m + moves)
  }

  const scoreProps = {
    score:score,
    targetScore:targetScore,
    playable: playable,
    gameOver: gameOver,
  }

  const boardProps = {
    setScore: SetScore,
    movesFunctions: [CheckMoves, CheckScore],
    setMoves: SetMoves,
    scoreList: scoreList,
    size: size,
    bag: bag,
    gameSpeed: gameSpeed,
    initialBoard: initialBoard(bag),
    bulletTime: bulletTime,
    specials: specials,
    playable: playable,
    gameOver: gameOver,
  }

  const gameDataProps = {
    moves: moves
  }

  return (
    <div id="screen">
      <Scores {...scoreProps}/>
      <div></div>
      <Board {...boardProps} />
      <GameData {...gameDataProps} />
      <div className="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
    </div>
  );
}

export default App;
