import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
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
// i can access now res.cookie and req.cookie 




//routers import

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRoute from './routes/comment.routes.js'
 
// routes declaration 
// app.get() not we did not import route but not now, we will use middleware 
// app.use("/user", userRouter)
app.use("/api/v1/user", userRouter)// to tell about the api version etc and /api/v1/user is prefix 

app.use("/api/v1/video", videoRouter)

app.use("/api/v1/like",likeRouter)

app.use("/api/v1/comment/")




export {app}