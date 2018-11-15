const plist = require("plist");
const fs = require("fs");
const { project: Project } = require("xcode");
const { join } = require("path");
module.exports.updatePlist = path => {
  const source = fs.readFileSync(path, "utf8");
  var o = plist.parse(source);
  if (o.CFBundleIdentifier) {
    o.CFBundleIdentifier = "$(PRODUCT_BUNDLE_IDENTIFIER";
    const xml = plist.build(o);
    if (xml != source) fs.writeFileSync(path, xml);
  }
};
module.exports.updatePbxproj = (path, newBundle) => {
  const project = Project(path);
  project.parseSync();
  console.log("Checking my buildconfigurations");
  Object.entries(project.pbxXCBuildConfigurationSection())
    .filter(([k]) => !k.endsWith("_comment"))
    .filter(([_, { isa }]) => isa == "XCBuildConfiguration")
    .filter(([_, { buildSettings: { TEST_HOST } }]) => {
      console.log("Hi there", TEST_HOST);
      return !TEST_HOST;
    })
    .forEach(([_, { buildSettings }]) => {
      const oldName = buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
      console.log("Checking name ", oldName);
      if (oldName != newBundle) {
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${newBundle}"`;
        buildSettings.PRODUCT_NAME = newBundle.split(".").pop();
        console.log("Setitng bundle to ", newBundle);
        // project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `"${newBundle}"`);
        // //Add the product name
        // project.addBuildProperty("PRODUCT_NAME", newBundle.split(".").pop());
      }
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
    .filter(([k]) => !k.endsWith("_comment"))
    .filter(([k, { isa }]) => isa == "XCBuildConfiguration")
    .find(
      ([_, { buildSettings }]) =>
        buildSettings && buildSettings.PRODUCT_BUNDLE_IDENTIFIER
    );
  return PRODUCT_BUNDLE_IDENTIFIER.replace(/"/g, "");
};
module.exports.getNameFromPbxproj = path => {
  const project = Project(path);
  project.parseSync();
  const productName = Object.entries(project.pbxXCBuildConfigurationSection())
    .filter(([k]) => !k.endsWith("_comment"))
    .filter(([k, o]) => o.isa == "XCBuildConfiguration")
    .filter(([_, o]) => o.buildSettings && o.buildSettings.PRODUCT_NAME)
    .map(([_, o]) => o.buildSettings.PRODUCT_NAME)
    .find(n => n.indexOf("$") === -1);
  return productName.replace(/"/g, "");
};
module.exports.getBundleBaseFromPackage = (thisPath = process.cwd()) => {
  const packagePath = join(thisPath, "package.json");
  const { iosBundleBase } = JSON.parse(packagePath);
  return iosBundleBase.trim();
};
module.exports.getBaseFromBundle = bundle => {
  const lastIndex = bundle.lastIndexOf(".");
  return lastIndex > -1 ? bundle.substring(0, lastIndex) : bundle;
};
module.exports.getNameFromBundle = bundle => {
  return bundle && bundle.split(".").pop();
};
