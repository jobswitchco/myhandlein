import mongoose from 'mongoose';

const username = 'myhandlein_db_user';
const password = process.env.MONGODB_PASSWORD;


var dbUrl = 'mongodb+srv://'+username+':'+password+'@cluster0.itfkrwb.mongodb.net/?appName=Cluster0';


const connectToMongo = ()=>{
    mongoose.connect(dbUrl).then()
    .catch((err) => { console.error(err); });
}

export default connectToMongo;