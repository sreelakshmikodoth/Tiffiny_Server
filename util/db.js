const mongoose = require("mongoose");
const express = require("express");
const app = express();

const dbConnect = async () => {
  
const clients = {};

  try {
    const dbresult=await mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.d0twn.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true
		}
  );
  if (dbresult){
      console.log("Connected to db");
    const server = app.listen(process.env.PORT || 3002);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      socket.on("add-user", (data) => {
        clients[data.userId] = {
          socket: socket.id,
        };
      });

      //Removing the socket on disconnect
      socket.on("disconnect", () => {
        for (const userId in clients) {
          if (clients[userId].socket === socket.id) {
            delete clients[userId];
            break;
          }
        }
      });
    });

  }
    console.log("db connection established");
  } catch (err) {
    console.log("db error");
  }
};

module.exports= dbConnect;