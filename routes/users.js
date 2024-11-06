import { Router } from "express";
import { testUser, register, login, profile, listUsers, updateUser, uploadAvatar, avatar, counters} from "../controllers/user.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from 'multer';
import { CloudinaryStorage } from "multer-storage-cloudinary";
import pkg from 'cloudinary';
const {v2: cloudinary} = pkg;

const storage = new CloudinaryStorage({
cloudinary: cloudinary,
params: {
folder: 'avatars',
allowedFormats: ['jpg', 'png', 'jpeg', 'gif'],
public_id: (req, file) => 'avatar-' +Date.now()

}

});
const uploads = multer({
storage: storage,
limits: {fileSize: 1 * 1024 * 1024}

});


const router = Router();

router.get("/test-user", ensureAuth, testUser);
router.post('/register',register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?' , ensureAuth,listUsers);
router.put('/update',ensureAuth, updateUser);
router.post('/upload-avatar',ensureAuth, uploads.single("file0"), uploadAvatar)
router.get ('/avatar/:id',avatar);
router.get('/counters/:id?', ensureAuth, counters);

export default router;

