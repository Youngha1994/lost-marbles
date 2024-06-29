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

export const ANIMATION_EFFECTS = {
  NONE: 'no-animation',
  CREATE_SPECIAL: 'create-special',
};

export const MARGIN_PERCENTAGE = 0.1

export const TRANSLATE_MODES = {
  TO_0: 0,
  FROM_0: 1,
  EASE_IN: 2
}

export const COLORS:string[] = [
  "red", "yellow", "blue", "orange", "green"
]
