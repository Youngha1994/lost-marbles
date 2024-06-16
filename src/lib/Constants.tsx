/** @const {string: number}  
 *  NO_MATCH_AFTER_FALLING: start of board. no matching after falling.  
 *  RELEASE: release interactionState. close to interactionState.  
 *  ANIMATING: any interactionState. closed to interactionState. animating images  
 *  AVAILABLE: no interactionState. open to interactionState  
 *  INTERACTING: interacting with index
 */
export const INTERACTION_STATES = {
  NO_MATCH_AFTER_FALLING: 0,
  RELEASE_INPUT: 1,
  ANIMATING: 2,
  AVAILABLE: 3,
  INTERACTING: 4,
};

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
