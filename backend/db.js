import mongoose from 'mongoose';

const username = 'myhandlein_db_user';
const password = 'daxmQ6t4HTL39Eo1';

var dbUrl = 'mongodb+srv://'+username+':'+password+'@cluster0.itfkrwb.mongodb.net/?appName=Cluster0';


const connectToMongo = ()=>{
    mongoose.connect(dbUrl).then()
    .catch((err) => { console.error(err); });
}

export default connectToMongo;