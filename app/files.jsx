let BrowserFS = require('../lib/browserfs/src/main.ts')

BrowserFS.install(window)
// Constructs an instance of the LocalStorage-backed file system.

var fsroot = new BrowserFS.FileSystem.MountableFileSystem()

fsroot.mount('/', new BrowserFS.FileSystem.LocalStorage())
fsroot.mount('/types', new BrowserFS.FileSystem.InMemory())
fsroot.mount('/public', new BrowserFS.FileSystem.InMemory())
fsroot.mount('/themes', new BrowserFS.FileSystem.InMemory())
fsroot.mount('/themes/frostmango', new BrowserFS.FileSystem.ZipFS(require('../lib/Frostmango-master.zip')))

fsroot.mount('/themes/decent', new BrowserFS.FileSystem.ZipFS(require('../lib/decent-v1.1.1.zip')))

BrowserFS.initialize(fsroot)

let fs = window.fs = window.require('fs');
let JSZip = require('jszip');


function initFS(safe, setupCb) {
  setupCb('checking infrastructure', 35);
  return Promise.all(
    ['/files',
     '/tmp',
     '/helpers',
     '/helpers/tpl',
     '/posts',
     '/public/assets',
     '/public/public'
      ].map((f, idx) => new Promise((rs, rj) => {
        fs.mkdir(f, (err) => rs()) // we don't care about problems
      }))
    ).then(() => {
      setupCb('ensuring files ', 40)
      return Promise.all([
        Promise.all([
          {name: '/types/mime.types',
           content: require("./raw/mime.types")},
          {name:'/types/node.types',
           content:""},
          {name:'/helpers/tpl/navigation.hbs',
           content:require("./raw/tpl/navigation.hbs")},
          {name:'/helpers/tpl/pagination.hbs',
           content: require("./raw/tpl/pagination.hbs")},
          {name: '/public/public/jquery.min.js',
           content: require("./raw/jquery.min.js")}
          ].map((f, idx) => new Promise((rs, rj) => {
            fs.writeFile(f.name, f.content, (err) => {
              err ? rj(err) : rs(f.name)
            })
          }))),
        new Promise((rs, rj) => {
          fs.exists('/config.yml', (exists) => {
            if (exists) {
              rs('/config.yml')
              return
            } else {
              setupCb('Creating initial setup.', 45)
              return Promise.all([
                new Promise((rs, rj) =>
                  fs.writeFile('/config.yaml',
                               require("./raw/default_config.yaml"),
                              () => rs())),
                new Promise((rs, rj) =>
                  fs.writeFile('/posts/example.md',
                               require("./raw/example.md"),
                              () => rs())),
                installTheme('decent')
              ]).then(() => {
                setupCb('Setup done', 50)
              })
            }
          })
        })
      ])
    }).then(() => {
      setupCb('infrastructure update done', 55)
    });
}

function _walkForZip(zip, path){
  fs.readdirSync(path).forEach(function(child){
    var childFile = path + '/' + child
    var stat = fs.statSync(childFile)
    if ( stat.isDirectory ()) {
      let folder = zip.folder(child)
      _walkForZip(folder, childFile)
    } else {
      let content = fs.readFileSync(childFile)
      zip.file(child, content.data.buff.buffer)
    }
  })
}

function makeZip() {
  var zip = new JSZip()
  _walkForZip(zip, '/public')
  zip.generateAsync({type:"base64"}).then(function (base64) {
    window.open("data:application/zip;base64," + base64, "download")
  }).catch(function (err){ console.error(err) });
}


function _collect_files_and_folders(files, folders, path){
  fs.readdirSync(path).forEach(function(child){
    var childFile = path + '/' + child
    var stat = fs.statSync(childFile)
    if (stat.isDirectory ()) {
      folders.push(childFile)
      _collect_files_and_folders(files, folders, childFile)
    } else {
      files.push(childFile)
    }
  })
}

function ignore_exists(err){
  if (err.isSafeError && (err.status === -502 || err.status === -505)){
    // -502: Directory Already Exists
    // -505: File Already Exists
    return true
  }
  throw err;
}

function _create_folders(safe, folders, opts){
  let next = folders.shift()
  console.log('Creating Folder', next);
  return safe.createDirectory(next, opts
    ).catch(ignore_exists
    ).then(() =>
      (folders.length) ? _create_folders(safe, folders, opts) : true
  )
}

function _sync_files(safe, files, opts){
  let next = files.shift()
  content = fs.readFileSync(next).toString();
  console.log('Creating File', next);
  return safe.createFile(next, opts
    ).catch(ignore_exists
    ).then(
      () => safe.updateFile( next, content, opts)).then(
        () => (files.length) ? _sync_files(safe, files, opts) : true
    )
}

function publish(safe){
  var files=[], folders=[];
  _collect_files_and_folders(files, folders, '/public')
  console.log(files, folders)
  let opts = {isPathShared: false, metadata: null};
  return safe.createDirectory('/public', opts
    ).catch(ignore_exists
    ).then(
      () => _create_folders(safe, folders, opts)
    ).then(
        () => _sync_files(safe, files, opts)
    );
}

function installTheme (theme) {
    return new Promise((rs, rj) => {
      // FIXME: make this actually async
      let fs = require("statical-ghost/lib/utils/fs-plus2.js");
      let copyFile = [{
        src: '/themes/' + theme + '/assets',
        dst: '/public/assets/'
      }, {
        src: '/themes/' + theme + '/favicon.ico',
        dst: '/public/favicon.ico'
      }]
      copyFile.forEach(function (copy) {
        if (fs.existsSync(copy.src)) {
          fs.copy(copy.src, copy.dst)
        }
      })
      rs()
    })
}

export { makeZip, installTheme, initFS, publish }
