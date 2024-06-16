import * as React from 'react';
import { useState } from 'react'
import './App.css'
import { Marble, MarbleType } from './components/Marble.tsx'
import { BlankTile, BlankTileType } from './components/BlankTile.tsx'
import Board from './components/Board.tsx'
import { xrange } from './lib/GridApi.tsx';
var seedrandom = require('seedrandom');

export type ItemType = BlankTileType | MarbleType;

const DEFAULT_COLORS:string[] = [
  "red", "yellow", "blue", "orange", "green", "purple"
]

const Scores = (params) => {
  return (
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
  )
}

const App = () => {
  const [score, setScore] = useState<number>(0)
  const [targetScore, setTargetScore] = useState<number>(0)
  const [size, setSize] = useState<[number, number]>([8, 8])
  const [gameSpeed, setGameSpeed] = useState<number>(2)
  const [seed, setSeed] = useState<string>("dev")
  const [bulletTime, setBulletTime] = useState<boolean>(false)

  const [bag, setBag] = useState<MarbleType[]>(
    DEFAULT_COLORS.reduce(
      (allMarbles:MarbleType[], color:string) => {
        const coloredMarbles:MarbleType[] = xrange(20).reduce(
          (coloredMarbles:MarbleType[]) => {
            return [...coloredMarbles, Marble({color: color})]
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

  const boardProps = {
    size: size,
    bag: bag,
    gameSpeed: gameSpeed,
    initialBoard: initialBoard(bag),
    bulletTime: bulletTime,
  }

  return (
    <div id="screen">
      <Scores score={score} targetScore={score}/>
      <div></div>
      <Board {...boardProps} />
      <div></div>
    </div>
  );
}

export default App;
