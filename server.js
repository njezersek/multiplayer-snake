const express = require("express");
const socketIO = require("socket.io");
const port = 3003;
const app = express();

app.use(express.static("public"));

const server = app.listen(port, ()=>{console.log("Server started on port: " + port)});

const io = socketIO(server);

const width = 40;
const height = 40;

const minFoodCount = 1;
const food = [];

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    socket.snakeBody = [{x: Math.floor(Math.random()*width), y: Math.floor(Math.random()*height)}];
    socket.snakeDirection = {x: 0, y: 0};
    socket.snakeDieing = false;

    socket.on("snake", ({snake, direction, snakeDieing}, callback) => {
        socket.snakeBody = snake;
        socket.snakeDirection = direction;
        socket.snakeDieing = snakeDieing;

        let snakes = [];
        var sockets = io.sockets.sockets;
        for(var socketId in sockets){
            let otherSocket = sockets[socketId];
            snakes.push({body: otherSocket.snakeBody, id: otherSocket.id});
        }

        // remove eaten food
        for(let i=0; i<food.length; i++){
            let fruit = food[i];
            if(snake[0].x == fruit.x && snake[0].y == fruit.y){
                food.splice(i--,1);
            }
        }

        // add food
        while(food.length < minFoodCount){
            food.push({x: Math.floor(Math.random()*width), y: Math.floor(Math.random()*height)});
        }

        callback({snakes, food, id: socket.id});
    });
    
    socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
});



