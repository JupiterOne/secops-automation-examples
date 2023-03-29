const {execSync} = require('child_process')

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const gitHubAuthFunct = () => { return { username: process.env.GITHUB_AUTH_TOKEN, password: '' }; };

const org = 'jupiterone';
const prbranch = "yarn2npm-patch-1";

const fs = require('fs');
const path = require("path");
const repoName = process.argv.slice(2);
const dir = `./${repoName}`;
const backupDir = 'yarn2npm';



const main = async () => {
    try {
        const origPath = process.cwd();
       
        //Create github branch
        await createYarn2NpmBranch(repoName, dir, org);

        if (fs.existsSync(`${dir}/package-lock.json`)){
            console.log(`${repoName} is already configured for npm`);
            return[];
        }

        //Create backup dir
        if (!fs.existsSync(`${dir}/${backupDir}`)){
            fs.mkdirSync(`${dir}/${backupDir}`);
        }

        //Backup package.json
        let copyFile = 'orig-package.json';
        console.log(`Backing up package.json to ${copyFile}`);
        fs.copyFile(`${dir}/package.json`, `${dir}/${backupDir}/${copyFile}`, (err) => {
            if (err) throw err;
        });
        await git.add({ fs, dir, filepath: `${backupDir}/${copyFile}` });
  
        //remove yarn.lock
        console.log(`Removing yarn.lock`);
        fs.unlink(`${dir}/yarn.lock`, (err) => {
           if (err) throw err;
        });
        await git.remove({ fs, dir, filepath: 'yarn.lock' });

        //npm install
        console.log(`Running npm install`);
        process.chdir(dir);
        try{
            execSync('npm install', {stdio: 'inherit'}, function(error) {
                if (error) {
                    console.log(`exit: ${error.code}`);
                }
            });
        }
        catch(e){
            console.log(`Error running npm install. Creating lock file ${backupDir}/failed.lock`);
            fs.closeSync(fs.openSync(`${origPath}/${backupDir}/failed.lock`, 'a'));
            await git.add({ fs, dir: `${origPath}/${backupDir}`, filepath: 'failed.lock' });
        }
        process.chdir(origPath);
        await git.add({ fs, dir, filepath: 'package-lock.json' });


        //Grab the npm log
        const npmlogDir = (`${require('os').homedir()}/.npm/_logs/`);
        const newestLog = (fs.readdirSync(npmlogDir)
                                .filter((file) => fs.lstatSync(path.join(npmlogDir, file)).isFile())
                                .map((file) => ({ file, mtime: fs.lstatSync(path.join(npmlogDir, file)).mtime }))
                                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()))[0].file;

        console.log(`Backing up npm logs`);
        fs.copyFile (`${npmlogDir}/${newestLog}`, `${dir}/${backupDir}/${newestLog}`, (err) => {
            if (err) throw err;
        });
        await git.add({ fs, dir, filepath: `${backupDir}/${newestLog }` });

        //Find and replace yarn commands
        console.log(`Replacing yarn commands with npm`);
        const packageFile = fs.readFileSync(`${dir}/package.json`, {
            encoding: 'utf8',
            flag: 'r',
          })
          .toString().replace(/yarn/g,'npm run');
        
        fs.writeFile(`${dir}/package.json`, packageFile, 'utf8', function (err) {
            if (err) return console.log(err);
        });
        await git.add({ fs, dir, filepath: 'package.json' });
               
        await pushChanges(dir);

        return [];
    } catch (e) {
      console.log(`Error ${e}`);
    }
}

async function pushChanges (dir) {
    console.log(`Pushing changes`);
    await git.commit({
      fs,
      dir,
      author: {
        name: 'J1 Security',
        email: 'security@jupiterone.com'
      },
      message: 'Updating yarn to npm'
    });
  
    await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      force: true,
      onAuth: gitHubAuthFunct
    });
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