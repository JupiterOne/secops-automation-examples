const {execSync} = require('child_process')

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const gitHubAuthFunct = () => { return { username: process.env.GITHUB_AUTH_TOKEN, password: '' }; };

const org = 'jupiterone';
const repo = process.argv.slice(2);
const prbranch = "yarn2npm-patch1";

const tmpDir="yarn2npm_tmp";
const fs = require('fs');
const path = require("path");
const dir = `${tmpDir}/${repo}`;
const backupDir = `${tmpDir}/${repo}/yarn2npm`;



const main = async () => {
    try {

        //Create tmp working
        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir);
        }
       
        //Create github branch
        await createYarn2NpmBranch(repo, dir, org)

        if (fs.existsSync(`${dir}/package-lock.json`)){
            console.log(`${repo} is already configured for npm`);
            return[];
        }

        //Create backup dir
        if (!fs.existsSync(backupDir)){
            fs.mkdirSync(backupDir);
        }

        //Backup package.json
        fs.copyFile(`${dir}/package.json`, `${backupDir}/package.json`, (err) => {
            if (err) throw err;
        });

        //remove yarn.lock
        fs.unlink(`${dir}/yarn.lock`, (err) => {
           if (err) throw err;
        });

        var currentPath = process.cwd();
        process.chdir(dir);
        console.log(`Running npm install`);
        try{
            execSync('npm install', {stdio: 'inherit'}, function(error) {
                if (error) {
                    console.log(`exit: ${error.code}`);
                }
            });
        }
        catch(e){
            console.log(`Error running npm install. Creating lock file ${backupDir}/failed.lock`);
            fs.closeSync(fs.openSync(`${currentPath}/${backupDir}/failed.lock`, 'a'));
        }

        //Grab the npm log
        const npmlogDir = (`${require('os').homedir()}/.npm/_logs/`);
        const newestLog = (fs.readdirSync(npmlogDir)
                                .filter((file) => fs.lstatSync(path.join(npmlogDir, file)).isFile())
                                .map((file) => ({ file, mtime: fs.lstatSync(path.join(npmlogDir, file)).mtime }))
                                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()))[0].file;

        console.log(`Backing up npm logs`);
        fs.copyFile (`${npmlogDir}/${newestLog}`, `${currentPath}/${backupDir}/${newestLog}`, (err) => {
            if (err) throw err;
        });

        //Find and replace yarn commands
        onsole.log(`Replacing yarn commands with npm`);
        const packageFile = fs.readFileSync(`package.json`, {
            encoding: 'utf8',
            flag: 'r',
          })
          .toString().replace(/yarn/g,'npm run')
        
        fs.writeFile(`package.json`, packageFile, 'utf8', function (err) {
            if (err) return console.log(err);
        });

        return [];
    } catch (e) {
      console.log(`Error ${e}`);
    }
}

async function createYarn2NpmBranch (repo, dir, org, branch = prbranch) {
    console.log(`Cloning Repo ${org}/${repo}...`);
    await cloneRepo(repo, dir, org);
    console.log(`Creating branch ${branch} for ${repo}...`);
    await checkoutBranch(dir, branch);
    return branch;
}

async function cloneRepo (repo, dir, org) {
    console.log(`Cloning https://github.com/${org}/${repo}`)
    try {
      await git.clone({
        fs,
        http,
        dir,
        url: `https://github.com/${org}/${repo}`,
        onAuth: gitHubAuthFunct,
        singleBranch: true,
        depth: 2
      });
    } catch (e) {
      console.log(`error here 2: ${e}}`);
    }
}

async function checkoutBranch (dir, ref) {
    await git.branch({
        fs,
        dir,
        ref,
        checkout: true
    });
}

main()