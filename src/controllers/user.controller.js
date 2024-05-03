const UserModel = require("../models/user.model.js");
const CartModel = require("../models/cart.model.js");
const jwt = require("jsonwebtoken");
const { createHash, isValidPassword } = require("../utils/hashbcryp.js");
const UserDTO = require("../dto/user.dto.js");
const passport = require("passport");

class UserController {
  async register(req, res) {
    const { first_name, last_name, email, password, age } = req.body;
    try {
      const existeUsuario = await UserModel.findOne({ email });
      if (existeUsuario) {
        return res.status(400).send("El usuario ya existe");
      }

      //Creo un nuevo carrito:
      const nuevoCarrito = new CartModel();
      await nuevoCarrito.save();

      const nuevoUsuario = new UserModel({
        first_name,
        last_name,
        email,
        cart: nuevoCarrito._id,
        password: createHash(password),
        age,
      });

      await nuevoUsuario.save();

      const token = jwt.sign({ user: nuevoUsuario }, "coderhouse", {
        expiresIn: "1h",
      });

      res.cookie("coderCookieToken", token, {
        maxAge: 3600000,
        httpOnly: true,
      });

      res.redirect("/api/users/profile");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error interno del servidor");
    }
  }
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const usuarioEncontrado = await UserModel.findOne({ email });

      if (!usuarioEncontrado) {
        return res.status(401).send("Usuario no válido");
      }

      const esValido = isValidPassword(password, usuarioEncontrado);
      if (!esValido) {
        return res.status(401).send("Contraseña incorrecta");
      }

      const token = jwt.sign({ user: usuarioEncontrado }, "coderhouse", {
        expiresIn: "1h",
      });

      res.cookie("coderCookieToken", token, {
        maxAge: 3600000,
        httpOnly: true,
      });

      res.redirect("/api/users/profile");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error interno del servidor");
    }
  }

  async profile(req, res) {
    try {
      const userDto = new UserDTO(
        req.user.first_name,
        req.user.last_name,
        req.user.email,
        req.user.rol
      );
      // Verificar si el usuario es administrador
      const isAdmin = req.user.rol === "admin";

      res.render("profile", { user: userDto, isAdmin }); // Pasar isAdmin a la vista
    } catch (error) {
      console.error("Error al obtener el perfil del usuario", error);
      res.status(500).send("Error interno del servidor");
    }
  }

  async logout(req, res) {
    res.clearCookie("coderCookieToken");
    res.redirect("/login");
  }
  //Github
  async githubAuth(req, res, next) {
    passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
  }

  // Callback después de la autenticación con GitHub
  async githubAuthCallback(req, res) {
    passport.authenticate("github", { failureRedirect: "/login" })(
      req,
      res,
      () => {
        // Después de la autenticación exitosa, puedes generar el token JWT y redirigir al perfil del usuario
        const token = jwt.sign({ user: req.user }, "coderhouse", {
          expiresIn: "1h",
        });
        res.cookie("coderCookieToken", token, {
          maxAge: 3600000,
          httpOnly: true,
        });
        res.redirect("/api/users/profile");
      }
    );
  }

  async admin(req, res) {
    if (req.user.user.role !== "admin") {
      return res.status(403).send("Acceso denegado");
    }
    res.render("admin");
  }
}

module.exports = UserController;
