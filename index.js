const express= require("express");
const mongoose= require("mongoose");
const authRouter = require("./routes/auth");
const cors =require("cors");
const documentRouter = require("./routes/document");
const http= require("http");
const Document= require("./models/document");
const DB= process.env.DB;
const BASE_URL= process.env.BASE_URL | "http://localhost:3001";


const PORT= process.env.PORT | 3001; //we will get the port from the server to which we have deployed our app  if that is not the case the default one 3001
const app= express(); // imported express in express and initializing it as app 
var  server= http.createServer(app);//create server with app[express]
var  io= require("socket.io")(server);

app.use(cors());
app.use(express.json()); //it is a middleware
app.use(authRouter);//middleware
app.use(documentRouter);




mongoose.connect(DB).then(()=>{
    console.log("connection successful");
}).catch((err)=>{
    console.log(err);
});

io.on("connection", (socket)=>{//this is how we listen to socket io calls, on connection with the client side we will get socket object and with this we can send data to client side
    console.log("connected"+socket.id);
    socket.on("join", (documentId)=>{
        //console.log("join ab yaha hai"+documentId);
        socket.join(documentId);
        console.log("joined"+ socket.id);
        
    });
    socket.on("typing",(data)=>{
        socket.broadcast.to(data.room).emit("changes",data);//broadcast means server will send the data recieved from client to all other client connected to that room except the client that has sent that data.
        // broadcast.to()=means that the server will send data only to the room with provided room id else it will send to all the client
        //console.log("typing");
        //io.to will send changes to everyone including the sender
        //socket.to will send only to sender
    });
    socket.on("save", (data) => {
        saveData(data);
        //console.log("save");
      });
}); 
const saveData = async (data) => {
    var content= data.delta;
    let document = await Document.findByIdAndUpdate(data.room,{content}); //we can also use findbyid and then update
    // document.content = data.delta;
    document = await document.save();
    //why have you not used api and http request to save and done it via socket
    // because what if we want to have a feature to notify all the clients connected to that room about changes that are made
    // we can inform all clients about changes made via io.to 
  };

server.listen(PORT, "0.0.0.0", ()=> {// we replaced app.listen with server.listen because now our server has changed it is socket server
    console.log(`connected at port ${PORT}`); // hostname is"0.0.0.0" that means we can access this server from any ip address
    console.log("its changing");

});