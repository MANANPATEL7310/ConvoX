import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}

import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socketManager.js";
// import bodyParser from "body-parser"; (
//! we do not need this as express has built-in body parser now. so for that we use the express.json() and express.urlencoded() methods)
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
const server=createServer(app);
const io=connectToSocket(server);
const MONGO_URL = process.env.MONGO_URL;


async function main() {
  await mongoose.connect(MONGO_URL);
};

main()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });


const allowedOrigins = `${process.env.FRONTEND_URL}`;

app.use(cors({
  origin:allowedOrigins,
  credentials:true
}));
// app.use(bodyParser.json());
app.use(express.json({limit:"40kb"}));
// app.use(express.urlencoded({limit:"40kb",extendeed:true})); 
//! (this also not needed when we use the react form. urlencoded only needed when we use the HTML form or EJS form which send the data in the form of the url encoded.)
app.use(cookieParser());


app.set("port",process.env.PORT || 8080);








const start=async ()=>{

  server.listen(app.get("port"),()=>{
    console.log("app is listening now.")
  })
}

start();


