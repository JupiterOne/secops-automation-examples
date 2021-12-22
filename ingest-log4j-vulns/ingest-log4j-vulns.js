const { JupiterOneClient } = require("@jupiterone/jupiterone-client-nodejs") 
const { v4: uuid } = require('uuid');
const fs = require("fs")


const authenticate = async () => {
    console.log('Authenticating...');
  
    const input = {
      accessToken: process.env.J1_ACCESS_TOKEN,
      account: process.env.J1_ACCOUNT,
      dev: process.env.J1_DEV_ENABLED
    };
  
    const j1 = new JupiterOneClient(input);
  
    await j1.init();
  
    console.log('Successfully authenticated...');
  
    return j1;
  };

const j1UniqueKeyFileLocation = `${process.cwd()}/j1-scope-key`

const getScope = () => {
    let scope;
    if (!fs.existsSync(j1UniqueKeyFileLocation)) {
        scope = uuid()
        fs.writeFileSync(j1UniqueKeyFileLocation, scope, 'utf8')
    } else {
        scope = fs.readFileSync(j1UniqueKeyFileLocation, 'utf8')
    }

    return scope;
}

// TODO: make this as a config value so shell script and node program reference same file location
const inputDataFilePath = "./results"

const sentinelDictionary = {
    0: "ip",
    1: "hostname",
    2: "appname",
    3: "team",
    4: "ignore (y/n)",
    5: "comments",
    6: "md5hash",
    7: "timestamp",
    8: "container",
    9: "image",
    10: "fullpath",
    11: "version",
}

const main = async () => {
    // Bail early if file doesn't exist
    // This indicates a problem upstream
    if (!fs.existsSync(inputDataFilePath)) return
    
    // utf8 guarantees our output is returned to us as a string
    const input = fs.readFileSync(inputDataFilePath, "utf8")?.trim()
    
    const j1 = await authenticate()
    const scope = getScope();
    
    // Ensure at least we have an array contains empty string
    const lines = input?.length ? input.split(/\n/) : []
    
    // Create entities to upload to J1
    const entities = lines.map((line) => {
        const sentinelDataProps = line?.toString().split(",") ?? []

        return {
            _key: uuid(),
            _type: 'log4j_vulnerability',
            _class: 'Finding',
            displayName: sentinelDictionary[11],
            [sentinelDictionary[0]]: sentinelDataProps[0],
            [sentinelDictionary[1]]: sentinelDataProps[1],
            [sentinelDictionary[6]]: sentinelDataProps[6],
            [sentinelDictionary[7]]: sentinelDataProps[7],
            [sentinelDictionary[8]]: sentinelDataProps[8] === 'true',
            [sentinelDictionary[9]]: sentinelDataProps[9],
            [sentinelDictionary[10]]: sentinelDataProps[10],
            [sentinelDictionary[11]]: sentinelDataProps[11],
        }
    })

    // Note: entities of 0 isn't necessarily a bad thing..
    // It's still needed to clear out existing data in the event
    // that there were previous vulnerabilities and they have since
    // been remediated.
    console.log('Entities Uploading :>> ', entities.length);

    await j1.bulkUpload({syncJobOptions: {scope}, entities})
    if (entities.length) {
      console.log('Entities may be found with a J1QL query like "Find log4j_vulnerability"')
    }
}

main().catch(console.error)