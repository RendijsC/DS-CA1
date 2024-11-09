## Serverless REST Assignment - Distributed Systems.

__Name:__ ....Rendijs Cielava .....

__Demo:__ ... link to your YouTube video demonstration ......

### Context.

State the context you chose for your web API and detail the attributes stored in the main database table.

This app is a gamestore which stores information on games and developers. 

In the games table information like id, developer, release year, description, orginal language and orginal title are store

In the developers tables information like game id whihc is the game they are associated to, developer name, role name, and role description.


### App API endpoints.

GET /games - Retrieve all games.
GET /games/{gameId} - Retrieve a specific game by its ID.
POST /games - Add a new game.
PUT /games/{gameId} - Update a specific game by its ID.
DELETE /games/{gameId} - Delete a specific game by its ID.
GET /games/developers?{gameId} - Retrieve all game developers.
Get /games/developers?gameId={gameId}&developerName= - Retrieve specific developer from game.
Get /games/developers?gameId={gameId}&roleName= - Retrive developer from game based of role.
POST /games/{gameId}/translate - Translate and update a game's fields to a specified language.

### Update constraint (if relevant).

Only users who are signed in can update a game.

### Translation persistence (if relevant).

[Briefly explain your design for the solution to avoid repeat requests to Amazon Translate - persist translations so that Amazon Translate can be bypassed for repeat translation requests.]

###  Extra (If relevant).

[ State whether you have created a multi-stack solution for this assignment or used lambda layers to speed up update deployments. Also, mention any aspect of the CDK framework __that was not covered in the lectures that you used in this assignment. ]

Translation was added which was not covered in the lab.
A game is able to be translated which then is saved back to teh games table.
