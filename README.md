## Serverless REST Assignment - Distributed Systems.

__Name:__ ....Rendijs Cielava .....

__Demo:__ ... https://youtu.be/vRQGSSX3jho ......

### Context.

This app is a gamestore which stores information on games and developers. 

In the games table information like id, developer, release year, description, orginal language and orginal title are stored

In the developers tables information like game id which is the game they are associated to, developer name, role name, and role description are stored.


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

A game is able to be translated and then saved to its own translation table which allows for persist translation. When translation is run on the game again it will retrieve the translation from the translation table.

###  Extra (If relevant).

Lambda Layers was utilized to speed up deployment. A common folder was created where recycled code is stored and then called when needed in lambdas.

authRequest is used to authenticate API request, this is reused in updateGame, deleteGame and addGame.

ddbClient is used in all lambdas this create a DynamoDB Document Client.

errorResponse is used in all lambdas this provides consistent success and error response for lambdas. 
