// require('dotenv').config({path: './env'})

import dotenv from "dotenv";

import {app} from "./app.js";

dotenv.config({
  path: "./.env",
});

import connectDB from "./db/index.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error:", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed!!.(app error)");
  });


  
/*
import express from 'express';
const app = express()
;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{ // listener
            console.log("Error:",error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is running on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error("Error:", error)
        throw err
    }
} )()

*/






