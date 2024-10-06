import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

//app.use for middlewares and configrations
app.use(cors({
    orgin: process.env.CORS_ORIGIN,
    //orgins of frontend that will allow acces to server 
    credentials: true,
    // study more about this
}))

// to config the data that out server will recive from frontend
app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({ extended : true, limit: "16kb"}))
// url is encoded so decode karna hota hai 
// extended to give object inside object 

app.use(express.static('public'))
// to store static file like images facicons etc 

app.use(cookieParser())
// to perform CRUD on cookie of user

const app = express()


export {app}