import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

// cookie-parser : used to set and access user's bowser cookies from server

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

// .use() used to config and setting middlewares
app.use(express.json({limit: "16kb"}))                           
app.use(express.urlencoded({extended: true, limit: "16kb"}))    // extended : object ke andar object
app.use(express.static("public"))                               // public assets on our server
app.use(cookieParser())

export { app }