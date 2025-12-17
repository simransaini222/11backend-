const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT 
const db = require("./server/config/db")
const {createAdmin} = require("./server/config/admin")
const route = require("./server/routes/route")
db()
createAdmin()


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/api",route)



app.listen(port,()=>{
    console.log(`server is running at port number http://localhost:${port}`)
})

// const cron = require("node-cron")

// cron.schedule('* * * * * *',()=>{
//     console.log("task is perform every each minute")
// })

