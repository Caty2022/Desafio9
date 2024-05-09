const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const initializePassport = require("./config/passport.config.js")(passport); // Llamando a initializePassport con passport como argumento
const PUERTO = 8080;
require("./database.js");

const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const userRouter = require("./routes/user.router.js");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/public/img");
    //Carpeta donde se guardan las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
    //Mantengo el nombre original
  },
});

///Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./src/public"));
;
app.use(cors());

app.use(cookieParser());
app.use(
  session({
    secret: "secretCoder",
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://catalinakrenz3316:coderhouse@cluster0.0yui3l4.mongodb.net/Ecommerce?retryWrites=true&w=majority&appName=Cluster0",
      ttl: 100,
    }),
  })
);
 const upload = multer({dest:"src/public/img"});
 app.post("/", upload.single("imagen"), (req, res) => {
   res.send("Archivo cargado!");
 });


// Passport
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//AuthMiddleware
const authMiddleware = require("./middleware/authmiddleware.js");
app.use(authMiddleware);

// Handlebars
app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");

// Rutas
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/users", userRouter);
app.use("/", viewsRouter);

const generatedProducts = require("./utils/products.utils.js");
app.get("/mockingproducts", (request, response) => {
  const products = [];

  for (let i = 0; i < 100; i++) {
    products.push(generatedProducts());
  }
  response.json(products);
});

const httpServer = app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});

///Websockets:
const SocketManager = require("./sockets/socketmanager.js");
new SocketManager(httpServer);
