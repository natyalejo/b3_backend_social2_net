import express from "express";
import dotenv from "dotenv";
import connection from "./database/connection.js";
import cors from "cors";
import bodyParser from "body-parser";
import UserRoutes from "./routes/users.js";
import PublicationRoutes from "./routes/publications.js";
import FollowRoutes from "./routes/follows.js";

dotenv.config();

console.log("API Node en ejecución");

connection();

const app = express();
const puerto = process.env.PORT || 4001;

app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/api/user', UserRoutes);
  app.use('/api/publication', PublicationRoutes);
  app.use('/api/follow', FollowRoutes);
 
  app.listen(puerto, () => {
    console.log("Servidor de Node ejecutándose en el puerto", puerto);
});

export default app ;











  
  

  
  

