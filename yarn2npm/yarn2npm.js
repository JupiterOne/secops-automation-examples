const {execSync} = require('child_process')

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const gitHubAuthFunct = () => { return { username: process.env.GITHUB_AUTH_TOKEN, password: '' }; };

const org = 'jupiterone';
const repo = process.argv.slice(2);
const prbranch = "yarn2npm-patch1";

const tmpDir="yarn2npm_tmp";
const fs = require('fs');
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
            console.log(`Error. Creating lock file ${backupDir}/failed.lock`);
            fs.closeSync(fs.openSync(`${currentPath}/${backupDir}/failed.lock`, 'a'));
        }

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