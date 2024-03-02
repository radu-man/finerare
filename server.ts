import express from "express";
import { graphqlHTTP } from "express-graphql";
import schema from './src/schema';
const { connectDB } = require('./src/db');
require('dotenv').config()

const port = process.env.PORT || 5000;

const server = express();

connectDB()

server.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

// @ts-ignore
server.listen(port, console.log(`Server running on port ${port}`));
