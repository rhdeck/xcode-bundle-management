const plist = require("plist");
const fs = require("fs");
const { project: Project } = require("xcode");
const { join } = require("path");
module.exports.updatePlist = path => {
  const source = fs.readFileSync(path, "utf8");
  var o = plist.parse(source);
  if (o.CFBundleIdentifier) {
    o.CFBundleIdendifier = "$(PRODUCT_BUNDLE_IDENTIFIER";
    const xml = plist.build(o);
    if (xml != source) fs.writeFileSync(path, xml);
  }
};
module.exports.updatePbxproj = (path, newBundle) => {
  const project = Project(path);
  project.parseSync();
  Object.keys(project.pbxXCBuildConfigurationSection())
    .filter(k => !k.endsWith("_comment"))
    .forEach(k => {
      const o = project.pbxXCBuildConfigurationSection()[k];
      if (!o.isa == "XCBuildConfiguration") return;
      const oldName = o.buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
      if (oldName != newBundle)
        project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `"${newBundle}"`);
    });
  fs.writeFileSync(path, project.writeSync());
};
module.exports.getBundleFromPbxproj = path => {
  const project = Project(path);
  project.parseSync();
  const [
    _,
    {
      buildSettings: { PRODUCT_BUNDLE_IDENTIFIER }
    }
  ] = Object.entries(project.pbxXCBuildConfigurationSection())
    .filter(k => !k.endsWith("_comment"))
    .find((k, o) => o.isa == "XCBuildConfiguration");
  return PRODUCT_BUNDLE_IDENTIFIER;
};
module.exports.getBundleBaseFromPackage = (thisPath = process.cwd()) => {
  const packagePath = join(thisPath, "package.json");
  const { iosBundleBase } = JSON.parse(packagePath);
  return iosBundleBase;
};
module.exports.getBaseFromBundle = bundle => {
  const lastIndex = bundle.lastIndexOf(".");
  return lastIndex > -1 ? bundle.substring(0, lastIndex) : bundle;
};
module.exports.getNameFromBundle = bundle => {
  return bundle.split(".").pop();
};
