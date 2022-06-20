# Tic Tac Toe game
Simple tic-tac-toe game web application

## Project setup
```
yarn install
docker create --name tictactoe-mongo -p 27017:27017 mongo:latest
```

### Compiles and hot-reloads for development
```
docker start tictactoe-mongo
yarn dev
```

### Unit tests
```
yarn test --watchAll
```

### Compiles and minifies for production
```
yarn build
```
