const mongoose = require("mongoose");
const configObject = require("./config/config.js");
const { mongo_url } = configObject;

mongoose.connect(mongo_url)
  .then(() => console.log("Conectados a la Base de datos"))
  .catch((error) =>console.log("Error de conexion con la base de datos", error)
  );
