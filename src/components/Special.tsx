export interface SpecialType {
  type: 'special';
  color: string;
  interactType: number;
  power: number;
}

export interface SpecialProps {
  interactType: number,
  power: number
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

const SPECIALS_COLORS = ['black', 'white', 'cyan', 'gray', 'magenta'];

export const Special = (SpecialProps:SpecialProps):SpecialType => {
  return (
    {
      type: "special",
      color: SPECIALS_COLORS[SpecialProps.interactType],
      interactType: SpecialProps.interactType,
      power: SpecialProps.power,
    }
  )
}
