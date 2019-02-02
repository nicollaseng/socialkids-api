const router = require('express').Router();
const path = require('path');
const auth = require('./middlewares/auth');
const appPath = path.dirname(require.main.filename);
const fs = require('fs');
const multer = require('multer');
const emailService = require('../services/email/index');
// const emailService = require('../services/email/index');
const userService = require('../services/user/index');
const User = require('../domain/models/user');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let base = `${appPath}`;
    let target = `../perfil/${req.user.id}`;
    var targetPath = createDir(base, target);
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    // let { userid } = req.headers;
    // let context = { user: req.user, memberships: req.memberships };
    // console.log('Context ', User, context, userid);
    // let extension = path.extname(file.originalname).replace(/\./g, '');
    let path = `${appPath}/../perfil/${req.user.id}/profile.png`;
    let name = incrementImageName(path);
    cb(null, name);
  }
});
const uploader = multer({ storage });

const storageEmail = multer.diskStorage({
  destination: (req, file, cb) => {
    let base = `${appPath}`;
    let target = `../emailprestacao`;
    var targetPath = createDir(base, target);
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'prestacaocontas.png');
  }
});
const uploaderPrestacao = multer({ storage: storageEmail });

const storageRegistro = multer.diskStorage({
  destination: (req, file, cb) => {
    let { leituraaguaid } = req.headers;
    let base = `${appPath}`;
    let target = `../registroagua/${leituraaguaid}`;
    var targetPath = createDir(base, target);
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'registro.png');
  }
});
const uploaderRegistro = multer({ storage: storageRegistro });

const createDir = (base, target) => {
  let basePath = base;
  let dirs = target.split(/\//);
  for(let i=0; i < dirs.length; i++) {
    var pathname = dirs[i];
    basePath += `/${pathname}`;
    try {
      fs.mkdirSync(basePath);
      console.log('Created Dir: ', basePath);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
  return `${basePath}`;
};

const incrementImageName = (imgPath) => {
  let newImgPath = imgPath, aux = 0;
  while(fs.existsSync(newImgPath)) {
    newImgPath = imgPath.replace('.png', '') + `(${++aux}).png`;
  }
  return aux > 0 ? `profile(${aux}).png` : 'profile.png';
}

router.post('/upload', auth.required, uploader.single('profile'), async (req, res) => {
  if(req.file && req.file.path && req.file.path != '') {
    let user = req.user;
    await user.update({ profile: req.file.filename });
    return res.json({ success: true, filename: req.file.filename });
  }
  return res.json({ success: false, filename: null });
});

router.post('/uploadregistro', auth.required, uploaderRegistro.single('registro'), async (req, res) => {
  if(req.file && req.file.path && req.file.path != '') {
    return res.json({ success: true, filename: req.file.filename });
  }
  return res.json({ success: false, filename: null });
});

router.post('/emailprestacao', auth.required, uploaderPrestacao.single('prestacao'), async (req, res) => {
  console.log(req.user, req.file);
  if(req.file && req.file.path && req.file.path != '') {
    let user = req.user;
    if(user.email) {
      const subject = 'Prestação de Contas de Condomínio';
      const template = 'send-prestacao-to-user';
      const templateContext = { name: user.name };
      const emails = user.email;
      emailService.sendEmailPrestacao(emails, subject, template, templateContext, req.file.path);
    }
    return res.json({ success: true, filename: req.file.filename });
  }
  return res.json({ success: false, filename: null });
});

router.get('*', auth.optional, (req, res) => {
  let url = req.path.split('/');
  // console.log(url);
  if(url.length != 3) {
    return res.json({ success: false, error: 'Malformed url' });
  } else {
    let profileURI = null;
    let userid = url[1];
    let filename = url[2];
    let extension = path.extname(filename).replace(/\./g, '');
    if(['jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'].indexOf(extension) < 0) {
      return res.json({ success: false, error: 'Wrong file format' });
    }
    if(userid == 'registro') {
      profileURI = `${appPath}/../registroagua/${filename.replace('.png','')}/registro.png`;
    } else {
      profileURI = `${appPath}/../perfil/${userid}/${filename}`;
    }
    if(!profileURI) {
      return res.json({ success: false, error: 'Invalid provided url' });
    }
    fs.readFile(profileURI, function(err, contents) {
      if(!err) {
        res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate' });
        res.contentType(`image/${extension}`);
        res.end(contents);
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }
});

module.exports = router;