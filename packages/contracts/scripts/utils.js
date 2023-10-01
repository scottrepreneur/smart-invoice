const fs = require("fs");

function writeDeploymentInfo(deploymentInfo, name) {
  fs.writeFileSync(
    `deployments/${name}.json`,
    JSON.stringify(deploymentInfo, undefined, 2),
  );
}

function readDeploymentInfo(name) {
  const data = fs.readFileSync(`deployments/${name}.json`, {
    encoding: "utf8",
  });

  return JSON.parse(data);
}

function appendImplementation(deploymentInfo, key, address) {
  const newDeploymentInfo = deploymentInfo;
  if (newDeploymentInfo.implementations[key] !== undefined) {
    newDeploymentInfo.implementations[key].push(address);
  } else {
    newDeploymentInfo.implementations[key] = [address];
  }
  return newDeploymentInfo;
}

function updateSpoilsManager(deploymentInfo, factory, implementation) {
  const newDeploymentInfo = deploymentInfo;
  if (!deploymentInfo.spoilsManager) {
    newDeploymentInfo.spoilsManager = {
      factory,
      implementations: [implementation],
    };
    return newDeploymentInfo;
  }

  const spoilsManagerImplementations =
    deploymentInfo.spoilsManager.implementations;
  if (deploymentInfo.spoilsManager.implementations.length > 0) {
    spoilsManagerImplementations.push(implementation);
  }
  newDeploymentInfo.spoilsManager = {
    factory,
    implementations: [implementation],
  };
  return newDeploymentInfo;
}

module.exports = {
  writeDeploymentInfo,
  readDeploymentInfo,
  appendImplementation,
  updateSpoilsManager,
};
