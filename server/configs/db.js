import mongoose from "mongoose";

const buildConnectionString = (mongoUrl) => {
    const mongoUri = new URL(mongoUrl);

    if (!mongoUri.pathname || mongoUri.pathname === '/') {
        mongoUri.pathname = '/quickshow';
    }

    return mongoUri.toString();
};

const connectDB=async()=>{
    try{
        mongoose.connection.on('connected',()=>console.log('Database connected'));
        mongoose.connection.on('error',(error)=>console.error('MongoDB connection error:', error.message));

        const mongoUrl = process.env.MONGODB_URL?.trim();
        if (!mongoUrl) {
            throw new Error('MONGODB_URL is not set');
        }

        const fallbackUrl = process.env.MONGODB_LOCAL_URL?.trim() || 'mongodb://127.0.0.1:27017/quickshow';

        try {
            await mongoose.connect(buildConnectionString(mongoUrl));
            return;
        } catch (primaryError) {
            const isSrvFailure = /querySrv|ENOTFOUND|ECONNREFUSED/i.test(primaryError.message);

            if (!isSrvFailure) {
                throw primaryError;
            }

            console.warn('Primary MongoDB connection failed, trying local fallback:', primaryError.message);
            await mongoose.connect(buildConnectionString(fallbackUrl));
        }

    } catch (error){
        console.log('Database connection failed:', error.message);
        throw error;

    }
}

export default connectDB;