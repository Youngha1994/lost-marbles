# Game Design Document

<b>Title</b>: Lost Marbles (PENDING) \
<b>Description</b>: Rougelike match-3 game

The game starts on a game board. This game board can be different shapes and sizes.
Level 1 starts with a 8x8 grid.

Player starts with a bag of marbles (starting number TBD). \
Top tray is filled with marbles from the bag. \
Marbles fall from the tray into the grid. \
There is 1 marble per square with different colors, patterns, and materials. \
Player selects and moves marble one space in cardinal direction. \
Matching 3+ pops marbles off the grid back into the bag. \
Marbles fall and may combo to more matches. \
Matched marbles are replaced from the tray until empty. \
If the tray is empty, no more marbles are replaced.
Once all matches are finished, marbles from the bag are returned to the tray.

See <i>Marble designs</i>.

## Marble designs
A marble can have a color and material or be a specific pattern. \
Consider: is this too many variations?

### Colors
Red \
Yellow \
Blue \
Green \
Orange \
Purple

Consider: more or less starting colors? \
    Harder difficuly adds more colors to the bag?

### Material
Glass - None \
Clay - Adds points \
Steel - Dropping increases odds of breaking below marble by 25% per square \
Plastic - Adds combo\
Agate 

### Patterned
Clear - None\
Mica (Spotted) - \
Opaque - \
Swirl - Rotates 3x3 grid.\
Catseye - Row or column\
Galaxy - Clears 5x5 grid\
Sulphide - Objective?\
