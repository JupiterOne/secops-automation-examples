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

    console.log("Finished creating entities in JupiterOne!!!");
}

async function formEntities(data) {
    var jsonData = JSON.parse(data);
    var entitiesToBePushed = [];
  
    for (var cve in jsonData.scannedCves) {

      var affectedPackages = [];
      for (var package in jsonData.scannedCves[cve].affectedPackages) {
        affectedPackages.push(jsonData.scannedCves[cve].affectedPackages[package].name);
      }

      var sev;
      var cvss2 = 0.0;
      var cvss3 = 0.0;
      for (var sevRating in jsonData.scannedCves[cve].cveContents) {
        if (jsonData.scannedCves[cve].cveContents[sevRating].cvss2Score > cvss2) {
          cvss2 = jsonData.scannedCves[cve].cveContents[sevRating].cvss2Score;
        }

        if (jsonData.scannedCves[cve].cveContents[sevRating].cvss3Score > cvss3) {
          cvss3 = jsonData.scannedCves[cve].cveContents[sevRating].cvss3Score;
        }
      }

      if (cvss3 > 0) {
        sev = cvss3;
      } else {
        sev = cvss2;
      }

      var severity = ""
      if (sev < 4.0) {
        severity = "low";
      } else if (sev < 6.9) {
        severity = "medium";
      } else if (sev < 8.9) {
        severity = "high";
      } else {
        severity = "critical";
      }

      var summary = "";
      for (var cveContent in jsonData.scannedCves[cve].cveContents) {
        var sum = summary;

        summary = jsonData.scannedCves[cve].cveContents[cveContent].summary;
        if ((sum.length !== 0) && (summary.length > sum.length)) {
            summary = sum;
        }

      }

  
      var entityProperties = {};
      entityProperties.cve = cve;
      entityProperties.serverName = jsonData.serverName;
      entityProperties.platform_name = jsonData.platform.name;
      entityProperties.platform_instanceID = jsonData.platform.instanceID;
      entityProperties.affectedPackages = affectedPackages;
      entityProperties.displayName = `vuls-finding-${jsonData.serverName}-${jsonData.release}-${cve}`;
      entityProperties.release = jsonData.release;
      entityProperties.family = jsonData.family;
      entityProperties.cvss = sev;
      entityProperties.summary = summary;
      entityProperties.severity = severity;
  
  
      const newEntity = {
        entityKey: `vuls-finding-${jsonData.serverName}-${jsonData.release}-${cve}`,
        entityType: 'vuls_finding',
        entityClass: 'Finding',
        properties: entityProperties
      };
  
      entitiesToBePushed.push(newEntity);
  
    }
  
    return entitiesToBePushed;
  }


module.exports = {
    createEntities,
    formEntities
  };