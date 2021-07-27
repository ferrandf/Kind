// Compiles apps from `Kind/base/App/*.kind to `src/apps/*.js`

var fs = require("fs");
var {exec, execSync} = require("child_process");

var code_dir = __dirname+"/src";
var kind_dir = __dirname+"/../base";

// TODO: remove from "src/apps" the ones that are no longer in "base/Apps"

process.chdir(code_dir);
var all_js_apps   = fs.readdirSync("apps").filter(x => x.startsWith("App."));
process.chdir(kind_dir);
var all_kind_apps = fs.readdirSync("App").filter(x => x.slice(-5) === ".kind");
var app = "";
var compiled_apps = [];

console.log("[1/2] Compiling apps:")
let args = process.argv[2];
// Only build 1 App
// Ex: node build App.Playground
if (args) { 
  app = all_kind_apps.filter(name => name.toLowerCase().endsWith(args+".kind"));
  if (app.lenght > 0) {
    compiled_apps = compile_app(app);
  } else {
    console.log("[error] App "+args+" not found.");
    process.exit(1);
  }
} else { // Build all Apps
  console.log("Tip: to build only 1 app, use \x1b[2mnode build.js app_name\x1b[0m.")
  for (var file of all_kind_apps) {
    compiled_apps.push(compile_app(file));
  }
}

// Compile app from ".kind" to ".js"
// Save it in "src/apps/"
function compile_app(name) {
  process.chdir(kind_dir);
  var name = "App."+name.slice(0,-5);
  console.log("- " + name);
  try {
    var code = String(execSync("kind "+name+" --js --module | js-beautify", {maxBuffer: 1024 * 1024 * 1024}));
  } catch (e) {
    console.log("Couldn't compile " + file + ". Error:");
    console.log(e.toString());
  }
  // Write compiled App file
  process.chdir(code_dir);
  fs.writeFileSync("apps/"+name+".js", code);
  return name;
}

// Write "src/app/index.js" to export the Apps
process.chdir(code_dir);
const remove_js_ext   = (name) => name.slice(0, -3);
const remove_kind_ext = (name) => app.slice(0,-5);
var index = "module.exports = {\n";
const add_line = (app) => "  '" + remove_js_ext(app) + "': import('./"+app+"'),\n";

if (app !== "") { // Check if need to add App to the export list
  const app_export_format = "App."+remove_kind_ext(app)+".js";
  if (all_js_apps.includes(app_export_format)) all_js_apps.concat(app_export_format);
}
// Order Apps alphabetically
all_js_apps.sort((a, b) => a.localeCompare(b)) 
for (var app of all_js_apps ) {
  index += add_line(app);
}
index += "}\n";
fs.writeFileSync("apps/index.js", index);

console.log("\n[2/2] Building index.js...");
exec("npm run build", function (err, stdout, stdin) {
  if (err) {
    console.log(err);
  } else {
    console.log("Done.");
  }
})
