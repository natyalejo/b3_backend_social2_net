import Follow from '../models/follows.js';
import User from '../models/users.js';
import { followUserIds } from "../services/followServices.js";



export const testFollow = (req, res) => {
    return res.status(200).
    send({
      message: "Mensaje enviado desde el controlador de Follow"
    });
  };
  
   export const saveFollow =async (req, res) =>{
    try {
   const {followed_user} = req.body;
   
   const identity = req.user;
   

   if(!identity || !identity.userId){
    return res.status (400).send({
      status: "error",
      message:"Nos e ha proporcionado el usuario para realizar el following"
     });
   };

if(identity.userId === followed_user){
  return res.status (400).send({
    status: "error" ,
    message:"No puedes seguirte a ti mismo"
   });
 }

const followedUser = await User.findById(followed_user);

if(!followedUser){
  return res.status (404).send({
    status: "error" ,
    message:"el usuario que intentas seguir no existe"
   });



}
const existingFollow = await Follow.findOne({
  following_user: identity.userId,
  followed_user: followed_user
});


if(existingFollow){
  return res.status (400).send({
    status: "error" ,
    message:"ya estas sigueindo a este usuario"
   });

}

const newFollow = new Follow({
  following_user: identity.userId,
  followed_user: followed_user

});

const followStored = await newFollow.save ();

if (!followStored){
  return res.status (500).send({
    status: "error" ,
    message:"No se ha podidio seguir al usuario"
   });

}

const followedUserDetails = await User.findById(followed_user).select ( 'name last_name');

if (!followedUserDetails){
  return res.status (404).send({
    status: "error" ,
    message:"usuario no encontrado"
   });

}

const combinedFollowData = {
  ...followStored.toObject(),
  followedUser: {
    name: followedUserDetails.last_name
  }
};

return res.status(200).json({
  status: "success",
  identity: req.user,
  follow: combinedFollowData
});



} catch (error) {
      if (error.code === 11000){
        return res.status (400).send({
         status: "error" ,
         message:"ya estas siguiendo a este usuario"
        });
      };

      return res.status (500).send({
        status: "error" ,
        message:"Error al seguir al usuario"
       });
    }

  
};




export const unfollow = async (req, res) => {
  try {
    // Obtener el Id del usuario indentificado desde el token
    const userId = req.user.userId;

    // Obtener el Id del usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id;

    // Búsqueda de las coincidencias de ambos usuarios y elimina
    const followDeleted = await Follow.findOneAndDelete({
      following_user: userId, // quien realiza el seguimiento
      followed_user: followedId // a quien se quiere dejar de seguir
    });

    // Verificar si se encontró el documento y lo eliminó
    if (!followDeleted) {
      return res.status(404).send({
        status: "error",
        message: "No se encontró el seguimiento a eliminar."
      });
    }

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Dejaste de seguir al usuario correctamente."
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al dejar de seguir al usuario."
    });
  }
};

// Método para listar usuarios que estoy siguiendo
export const following = async (req, res) => {
  try {
    // Obtener el ID del usuario identificado
    let userId = req.user && req.user.userId ? req.user.userId : undefined;
    console.log(userId);
    // Comprobar si llega el ID por parámetro en la url (este tiene prioridad)
    if (req.params.id) userId = req.params.id;
    console.log(userId);
    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Número de usuarios que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    // Configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      populate: {
        path: 'followed_user',
        select: '-password -role -__v -email'
      },
      lean: true
    }

    // Buscar en la BD los seguidores y popular los datos de los usuarios
    const follows = await Follow.paginate({ following_user: userId }, options);

    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que estoy siguiendo",
      follows: follows.docs,
      total: follows.totalDocs,
      pages: follows.totalPages,
      page: follows.page,
      limit: follows.limit,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios que estás siguiendo."
    });
  }
}


// Método para listar los usuarios que me siguen
export const followers = async (req, res) => {
  try {
    // Obtener el ID del usuario identificado
    let userId = req.user && req.user.userId ? req.user.userId : undefined;

    // Comprobar si llega el ID por parámetro en la url (este tiene prioridad)
    if (req.params.id) userId = req.params.id;

    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Número de usuarios que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    // Configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      populate: {
        path: 'following_user',
        select: '-password -role -__v -email'
      },
      lean: true
    }
    
    // Buscar en la BD los seguidores y popular los datos de los usuarios
    const follows = await Follow.paginate({ followed_user: userId }, options);

    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que me siguen",
      follows: follows.docs,
      total: follows.totalDocs,
      pages: follows.totalPages,
      page: follows.page,
      limit: follows.limit,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios que me siguen."
    });
  }
}

