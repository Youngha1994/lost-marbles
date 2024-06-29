export interface SpecialType {
  type: 'special',
  color: string,
  interactType: number,
  power: number,
  score: number
}

export interface SpecialProps {
  interactType: number,
  power: number,
  score: number
}

/** @const {string: number}  
 *  NONE: default  
 *  ROCKET_HORIZONTAL: clears horizontal  
 *  ROCKET_VERTICAL: clears vertical  
 *  BOMB: clears neighbors  
 *  CTRL_F: clears color  
 *  CTRL_A: clears all  
 */
export const SPECIALS = {
  NONE: 0,
  ROCKET_HORIZONTAL: 1,
  ROCKET_VERTICAL: 2,
  BOMB: 3,
  CTRL_F: 4,
  CTRL_A: 5,
};

export const SPECIALS_POWER = {
  NONE: 0,
  ROCKET_HORIZONTAL: 2,
  ROCKET_VERTICAL: 2,
  BOMB: 1,
  CTRL_F: 1,
  CTRL_A: 1,
}

const SPECIALS_COLORS = ['black', 'white', 'cyan', 'gray', 'magenta'];

export const Special = (specialProps:SpecialProps):SpecialType => {
  return (
    {
      type: "special",
      color: SPECIALS_COLORS[specialProps.interactType],
      interactType: specialProps.interactType,
      power: specialProps.power,
      score: specialProps.score
    }
  )
}
