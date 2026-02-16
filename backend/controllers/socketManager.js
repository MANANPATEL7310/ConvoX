import {Server} from "socket.io"


export const connectToSocket=(server)=>{
  const io=new Server(server);


 io.on('connection',(socket)=>{
  console.log("user is connected.");

  socket.on('disconnect',()=>{
    console.log("user is disconnected.");
  })
 })


  return io;
}


