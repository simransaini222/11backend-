const mongoose = require("mongoose")

const connectDB = async() =>{
    try{
        await mongoose.connect(process.env.MONGO_URL,{
            useNewUrlParser:true,  // use new url parser for stable connection string
            useUnifiedTopology:true,//use modern connection managment engine
            serverSelectionTimeoutMS:20000 // wait max 20 second to conenct before failing
        })
        console.log("mongodb is connect successfully")

    }catch(err){
 console.log("mongodb is not connected successfully due to error",err)
 process.exit(1)
    }
}

module.exports = connectDB