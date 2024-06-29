import * as React from 'react';
import './GameData.css';

interface MovesParamsType {
  moves:number
}

interface GameDataProps {
  moves: number
};

const Moves = (params:MovesParamsType):React.JSX.Element => {
  return (
    <React.Fragment>
      <div>Moves Left</div>
      <div>{params.moves}</div>
    </React.Fragment>
  )
};

const GameData = (gameDataProps:GameDataProps):React.JSX.Element => {
  const moves = gameDataProps.moves;
  return (
    <div className='game-data-container'>
      <div className='moves-left-container'>
        <Moves moves={moves} />
      </div>
    </div>
  )
}
export default GameData;
