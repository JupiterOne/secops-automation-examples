async function createEntities (j1Client, entities) {
    for (const e of entities) {
      const classLabels = Array.isArray(e.entityClass)
        ? e.entityClass
        : [e.entityClass];
  
      e.properties.createdOn = e.properties.createdOn
        ? new Date(e.properties.createdOn).getTime()
        : new Date().getTime();
  
      await j1Client.createEntity(
        e.entityKey,
        e.entityType,
        classLabels,
        e.properties
      );
    }

    console.log("Finished creating entities in JupiterOne.");
}

async function formEntities(data) {
    const jsonData = JSON.parse(data);
    const entities = [];
  
    for (const cve in jsonData.scannedCves) {

      const affectedPackages = [];
      for (const package in jsonData.scannedCves[cve].affectedPackages) {
        affectedPackages.push(jsonData.scannedCves[cve].affectedPackages[package].name);
      }

      let numericSeverity;
      let cvss2 = 0.0;
      let cvss3 = 0.0;
      for (const sevRating in jsonData.scannedCves[cve].cveContents) {
        if (jsonData.scannedCves[cve].cveContents[sevRating].cvss2Score > cvss2) {
          cvss2 = jsonData.scannedCves[cve].cveContents[sevRating].cvss2Score;
        }

        if (jsonData.scannedCves[cve].cveContents[sevRating].cvss3Score > cvss3) {
          cvss3 = jsonData.scannedCves[cve].cveContents[sevRating].cvss3Score;
        }
      }

      if (cvss3 > 0) {
        numericSeverity = cvss3;
      } else {
        numericSeverity = cvss2;
      }

      let severity = "";
      if (numericSeverity < 4.0) {
        severity = "low";
      } else if (numericSeverity < 6.9) {
        severity = "medium";
      } else if (numericSeverity < 8.9) {
        severity = "high";
      } else {
        severity = "critical";
      }

      let summary = "";
      for (const cveContent in jsonData.scannedCves[cve].cveContents) {
        const sum = jsonData.scannedCves[cve].cveContents[cveContent].summary;

        if (sum && sum.length > summary.length) {
            summary = sum;
        }
      }

      const instanceId = 
        jsonData.platform.instanceID.length > 0 && jsonData.platform.instanceID;
      const containerId = 
        jsonData.container.containerID.length > 0 && jsonData.container.containerID;
      const serverUUID = 
        jsonData.serverUUID.length > 0 && jsonData.serverUUID;
      const targets = 
        instanceId || containerId || serverUUID || jsonData.ipv4Addrs;
  
      const entityProperties = {
        displayName: `vuls-finding-${jsonData.serverName}-${jsonData.release}-${cve}`,
        cve,
        cvss: numericSeverity,
        cvss2,
        cvss3,
        numericSeverity,
        summary,
        severity,
        serverName: jsonData.serverName,
        platform: jsonData.platform.name,
        instanceId,
        containerId,
        affectedPackages: affectedPackages,
        release: jsonData.release,
        family: jsonData.family,
        targets,
        createdOn: jsonData.reportedAt,
      };
  
      const newEntity = {
        entityKey: `vuls-finding-${jsonData.serverName}-${jsonData.release}-${cve}`,
        entityType: 'vuls_finding',
        entityClass: 'Finding',
        properties: entityProperties
      };
  
      entities.push(newEntity);
    }
  
    return entities;
  }


module.exports = {
  createEntities,
  formEntities
};