// agenda.js
import Agenda from "agenda";
const username = 'myhandlein_db_user';
const password = process.env.MONGODB_PASSWORD;

var dbUrl = 'mongodb+srv://'+username+':'+password+'@cluster0.pxlgkov.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const agenda = new Agenda({
  db: {
    address: dbUrl, // ✅ Your MongoDB connection string
    collection: "agendaJobs",      // Collection where jobs will be stored
  },
  processEvery: "10 seconds", // How often it checks for due jobs
  maxConcurrency: 20,
  defaultConcurrency: 5,
});

export default agenda;
