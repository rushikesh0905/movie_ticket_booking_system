import mongoose from "mongoose";

const uri =
"mongodb+srv://rushikesh:student@cluster0.frzf2q0.mongodb.net/quickshow?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
.then(() => {
    console.log("CONNECTED SUCCESSFULLY");
    process.exit(0);
})
.catch((err) => {
    console.error("FAILED:");
    console.error(err);
    process.exit(1);
});