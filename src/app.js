import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

//app.use for middlewares and configrations
app.use(cors({
    orgin: process.env.CORS_ORIGIN,
    //orgins of frontend that will allow acces to server 
    credentials: true,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({ extended : true, limit: "16kb"}))
app.use(express.static('public'))
const app = express()


export {app}