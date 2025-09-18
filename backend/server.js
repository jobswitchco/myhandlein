import express from 'express';
import http from 'http';
import dbConnection from "./db.js";
import bodyParser from "body-parser";
import cors from 'cors';
import usersOnBoard from "./routes/usersOn.js";
dbConnection();
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionSuccessStatus: 200,
  changeOrigin: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use("/usersOn", usersOnBoard);

const server = http.createServer(app);

server.listen(8001, () => {
  console.log('Server is running on port 8001');
});





