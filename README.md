# Game Design Document

<b>Title</b>: Cats Out of the Bag \
<b>Description</b>: Rougelike match-3 game

The game starts on a game board. This game board can be different shapes and sizes.
Level 1 starts with a 8x8 grid.

Player starts with a bag of items (starting number TBD). \
Top tray is filled with items from the bag. \
Items fall from the tray into the grid. \
There is 1 item per square with different colors, patterns, and materials. \
Player selects and moves item one space in cardinal direction. \
Matching 3+ pops items off the grid back into the bag. \
Items fall and may combo to more matches. \
Matched items are replaced from the tray until empty. \
If the tray is empty, no more items are replaced.
Once all matches are finished, items from the bag are returned to the tray.

See <i>Item designs</i>.

## Item designs
A item can have a color and material or be a specific pattern. \
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
Steel - Dropping increases odds of breaking below item by 25% per square \
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
