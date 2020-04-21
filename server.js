const express = require("express");
const socketIO = require("socket.io");
const port = 3003;
const app = express();

app.use(express.static("public"));

const server = app.listen(port, ()=>{console.log("Server started on port: " + port)});

const io = socketIO(server);

const width = 40;
const height = 40;

const minFoodCount = 3;
const food = [];

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    socket.snakeBody = [{x: Math.floor(Math.random()*width), y: Math.floor(Math.random()*height)}];
    socket.snakeDirection = {x: 0, y: 0};
    socket.snakeDieing = false;

    socket.on("direction", (dir) => {
        let oldDir = socket.snakeDirection;
        if(oldDir.x + dir.x == 0 && oldDir.y + dir.y == 0 )return; // prevent snake from turning into itself

        socket.snakeDirection = dir;
    });
    
    socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
});



function tick(){
    let snakes = [];
    var sockets = io.sockets.sockets;
    for(var socketId in sockets){
        var socket = sockets[socketId]; //loop through and do whatever with each connected socket
        if(!socket.snakeDieing){
            // move snake
            let head = socket.snakeBody[0];
            let newHead = {
                x: (head.x + socket.snakeDirection.x + width) % width,
                y: (head.y + socket.snakeDirection.y + height) % height
            }

            // food collision
            let eaten = false;
            for(let i=0; i<food.length; i++){
                let f = food[i];
                if(newHead.x == f.x && newHead.y == f.y){
                    food.splice(i,1);
                    eaten = true;
                    i--;
                }
            }

            // self collision
            for(let s of socket.snakeBody){
                if(newHead.x == s.x && newHead.y == s.y){
                    socket.snakeDieing = true;
                }
            }

            // other snakes collision
            for(var otherId in sockets){
                var otherSocker = sockets[otherId];
                for(let s of otherSocker.snakeBody){
                    if(newHead.x == s.x && newHead.y == s.y){
                        socket.snakeDieing = true;
                    }
                }
            }

            socket.snakeBody.unshift(newHead);
            if(!eaten)socket.snakeBody.pop();
        }
        else{
            if(socket.snakeBody.length > 1){
                socket.snakeBody.pop();
            }
            else{
                socket.snakeDieing = false;
                socket.snakeDirection = {x: 0, y: 0};
            }
        }

        // add food
        while(food.length < minFoodCount){
            food.push({x: Math.floor(Math.random()*width), y: Math.floor(Math.random()*height)});
        }



        snakes.push({body: socket.snakeBody, id: socket.id});
    }
    io.emit("update", {snakes, food, width, height});
}

setInterval(tick, 100);



