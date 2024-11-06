import User from '../models/users.js';
import Follow from '../models/follows.js';
import Publication from '../models/publications.js';
import bcrypt from 'bcrypt';
import { createToken } from '../services/jwt.js';
import { followThisUser, followUserIds } from '../services/followServices.js';
  
export const testUser = (req, res) => {
    return res.status(200).
    send({

      message: "Mensaje enviado desde el controlador de Usuarios"
    });
  };
  
    
 export const register = async (req, res) => {
try {

  let params =req.body;

  if (!params.name || !params.last_name || !params.nick || !params.email || !params.password)  {
 return res.status (400).json({
 status:"error",
 message:"faltan datos por enviar"
 });
 }

 let user_to_save = new User(params);
    

 const existingUser  = await User.findOne({
 $or:[
  {email: user_to_save.email.toLowerCase() },
  {nick: user_to_save.nick.toLowerCase() }
 ]
 });

 if (existingUser){
 return res.status(409).send({
 status: "error",
 message: "el usuario ya existe en la BD"

 });

 }

const salt = await bcrypt.genSalt(10);

const hashedPassword = await bcrypt.hash(user_to_save.password, salt);

 user_to_save.password = hashedPassword

 
await user_to_save.save();


  return res.status(201).json({
    
    status: "created",
    message: "registro de usuario exitoso",
    user_to_save
    
  });



}  catch (error) {
  console.log ("error en le registro de usuarios", error);

  return res.status(500).send({
    status: "error",
    message: "error en le registro de usuario"
  });

 }

}

export const  login = async (req, res)=> {
try{

  let params = req.body;



  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar"
    });
  }
  

  const userBD = await User.findOne({ email: params.email.toLowerCase() });

if (!userBD) {
  return res.status(404).send ({
    status:"error",
    message: "usuario no encontrado"
  });
}

const validpassword = await bcrypt.compare(params.password, userBD.password);

if (!validpassword){
  return res.status(401).send({
    status: "error",
    message: "contraseña incorrecta"
  });
}

const token  =  createToken(userBD);


  return res.status(200).json({ 
    status: "success",
    message: "Autenticacion exitosa",
    token,
    userBD: {
      id:userBD._id,
      name: userBD.name,
      last_name:userBD.last_name,
      email: userBD.email,
      nick: userBD.nick,
      image: userBD.image
    }
    
  });


}catch  (error) {
console.log ("error en la autenticacion del usuario", error);
  return res.status(500).send({
    status: "error",
    message: "error en la autenticacion de usuario"
  });

}

};

export const profile = async (req, res) => {
try {
 
  const userId = req.params.id;

  if (!req.user || !req.user.userId) {
    return res.status(401).send({
      status: "sucess",
      message: "Usuario no autenticado"
    });
  }

  const userProfile = await User.findById(userId).select('-password -role -email -__v');

    // Verificar si el usuario buscado no existe
    if(!userProfile){
      return res.status(404).send({
        status: "success",
        message: "Usuario no encontrado"
      });
    }

  const followInfo = await followThisUser(req.user.userId, userId);


    // Devolver la información del perfil del usuario solicitado
    return res.status(200).json({
      status: "success",
      user: userProfile,
      followInfo
    });

  } catch (error) {
    console.log("error al obtener el perfil del usuario:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil de usuario"
    });
  }
};

export const listUsers =async (req, res) => {
 try {
let page = req.params.page ? parseInt(req.params.page, 10) : 1;
let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

const options ={
page:  page,
limit: itemsPerPage,
select: '-password -email -role -__v'

};

const users = await User.paginate({}, options);

if(!users || users.docs.length === 0){
  return res.status(404).send ({
    status: "error",
    message: "no existen usuarios disponibles"
  });
}

let followUsers = await followUserIds(req);


return res.status(200).json({
  status:"sucess",
  users: users.docs,
  totalDocs: users.totalDocs,
  totalPages: users.totalPages,
  currentPage: users. page,
  users_following: followUsers.following,
  user_follow_me: followUsers.followers
})

}catch (error) {
  console.log ("error al listar los usuarios:", error);
  return res.status(500).send({
    status: "error",
    message: "Error al listar los usuarios"
  });
}
};

 export const updateUser = async (req,res) => {
  
  try {
let userIdentity = req.user;
let userToUpdate = req.body;

delete userToUpdate.iat;
delete userToUpdate.export;
delete userToUpdate.role;

const users = await User. find({
$or: [
{ email: userToUpdate.email},
{nick: userToUpdate .nick}

]

}).exec();


const isDuplicateUser = users.some(user =>{
  return user && user._id.toString() !== userIdentity.userId;
});
if(isDuplicateUser) {
return res.status(400).send({
status: "error",
message:"error, solo se puede actualizar los datos del usuario logueado"

})


}

if(userToUpdate.password){
try {
  let pwd = await bcrypt.hash(userToUpdate.password,10);
  userToUpdate.password =pwd;
}catch (hashError) {
return res.status(500).send({
status:"error",
message: "Error al cifrar la contraseña"

});
}

} else {
  delete userToUpdate.password;
}

let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, 
   userToUpdate, {new: true});

   if(!userUpdated){
    return res.status(400).send ({
      status:"error",
      message: "Error al actualizar el usuario"
    });

   };


return res.status(200).json({
  status:"success",
  message:"usuario actualizado correctamente",
  user: userUpdated
});

  } catch (error) {
    console.log ("error al actualizar los datos del usuario:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los datos  del usuarios"
    });
  

  }

 };
 
export const uploadAvatar = async (req, res) => {
try{

  if (!req.file){
  return res.status(400).send({
    status:"error",
    message: "error la peticion no incluye la imagen"

  });

  
}


const avatarUrl = req.file.path;

const userUpdated = await User.findByIdAndUpdate(
  req.user.userId,
  {image: avatarUrl},
  {new:true}
);

if(!userUpdated) {
return res.status(500).send({
status: "error",
message: "Error al subir el archivo de avatar"

});
}

return res. status(200).json({
status:"success",
user: userUpdated,
file: avatarUrl

});

}catch (error){
  console.log ("Error al subir el archivo del avatar", error);
  return res.status(500).send({

    status:"error",
    Message: "Error al subir avatar"
  });

}


};


export const avatar =async (req, res)=>{
try{


  const userId = req.params.id;

  const user = await User.findById(userId).select ('image');

  if(!user || !user.image){
 return res.status(404).send({
  status: "error",
  message:"no existe usuario o imagen"
 });

  
}
return res.redirect(user.image);


} catch (error) {
  console.log ("Error al mostrar el archivo del avatar", error);
  return res.status(500).send({

    status:"error",
    Message: "Error al mostrar el avatar"
  });
}

};


// Método para mostrar contador de seguidores y publicaciones
export const counters = async (req, res) => {
  try {
    // Obtener el Id del usuario autenticado (token)
    let userId = req.user.userId;


    // Si llega el id a través de los parámetros en la URL tiene prioridad
    if(req.params.id){
      userId = req.params.id;
    }

    // Obtener el nombre y apellido del usuario
    const user = await User.findById(userId, { name: 1, last_name: 1});



    // Vericar el user
    if(!user){
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
    const followingCount = await Follow.countDocuments({ "following_user": userId });

    // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
    const followedCount = await Follow.countDocuments({ "followed_user": userId });

    // Contador de publicaciones del usuario autenticado
    const publicationsCount = await Publication.countDocuments({ "user_id": userId });

    // Devolver los contadores
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      followingCount: followingCount,
      followedCount: followedCount,
      publicationsCount: publicationsCount
    });

  } catch (error) {
    console.log("Error en los contadores", error)
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores"
    });
  }
}