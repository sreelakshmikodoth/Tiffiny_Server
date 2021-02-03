const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require('aws-sdk')

require('dotenv').config()

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/item");
const userRoutes = require("./routes/user");
//const dbConnect = require("./util/db");
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Math.floor(Math.random() * 90000) + 10000 + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  )
    cb(null, true);
  else cb(null, false);
};

const app = express();

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
const s3 = new aws.S3({
  accessKeyId:process.env.AWS_ACCESSKEYID,
secretAccessKey:process.env.AWS_SECRETACCESSKEY
 })


const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'tiffinyapp',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null,Math.floor(Math.random() * 90000) + 10000 + "-" + file.originalname)
    }
  })
})

exports.deleteImg = (filekey)=>{
  s3.deleteObject({
  Bucket: "tiffinyapp",
  Key: filekey
},function (err,data){})
}

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

//set headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", uploadS3.array("images", 10), authRoutes);
app.use("/seller", uploadS3.array("image",10), itemRoutes);
app.use(userRoutes);

//error middleware
app.use((error, req, res, next) => {
  console.log(error + "--------------------------");
  const statusCode = error.statusCode || 500;
  const message = error.message;
  let errorsPresent;
  if (error.errors) {
    errorsPresent = error.errors;
  }

  res.status(statusCode).json({
    message: message,
    errors: errorsPresent,
  });
});

const clients = {};
app.set( 'port', ( process.env.PORT || 3002 ));

// Start node server
// app.listen( app.get( 'port' ), function() {
//   console.log( 'Node server is running on port ' + app.get( 'port' ));
//   });

const dbConnect = async () => {
  
//console.log("processssssssssssssssssssss",process.env)
  try {
    const dbresult=await mongoose.connect(
     `mongodb+srv://slk:slk123@cluster0.d0twn.mongodb.net/tiffinyApp?retryWrites=true&w=majority`, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true
		}
  );
  if (dbresult){
      console.log("Connected to db");
    const server = app.listen(app.get( 'port' ));
    const io = require("./util/socket").init(server);
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
    console.log("process",process.env);
    console.log("db error");
  }
};
dbConnect();
//const clients = dbConnect();



exports.clients = clients;
