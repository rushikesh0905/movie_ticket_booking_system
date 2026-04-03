import mongoose from "mongoose";

const connectDB=async()=>{
    try{
        mongoose.connection.on('connected',()=>console.log('Database connected'));
        const mongoUrl = process.env.MONGODB_URL?.replace(/\/+$|\s+$/g, '');
        const hasDatabase = /^mongodb(?:\+srv)?:\/\/[^/]+\/.+/.test(mongoUrl);
        const connectionString = hasDatabase ? mongoUrl : `${mongoUrl}/quickshow`;
        await mongoose.connect(connectionString)

    } catch (error){
        console.log(error.message);

    }
}

export default connectDB;