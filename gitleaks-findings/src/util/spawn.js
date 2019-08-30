const spawn = require('child_process').spawn;
const chalk = require('chalk');

function buildLogPrefix (command, args) {
  let prefix = command;
  if (args) {
    for (const arg of args) {
      if (arg.charAt(0) === '-') {
        break;
      } else {
        prefix += ' ' + arg;
      }
    }
  }
  return '[' + prefix + '] ';
}

module.exports = async (command, args, options) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options);
    const LOG_PREFIX = (options.logPrefix === null)
      ? null // don't add log prefix
      : chalk.gray(options.logPrefix || buildLogPrefix(command, args));

    let stdoutDataReceived = false;
    let stderrDataReceived = false;

    // Add a `proc.stdout` data listener if `options.logOutput` is `true`
    // or the caller didn't provide their own handler.
    if (options.logOutput || !options.onStdoutData) {
      proc.stdout.on('data', (data) => {
        if (LOG_PREFIX && !stdoutDataReceived) {
          process.stdout.write(LOG_PREFIX);
          stdoutDataReceived = true;
        }

        data = data.toString('utf8');
        if (LOG_PREFIX) {
          data = data.replace(/\n/g, `\n${LOG_PREFIX}`);
        }
        process.stdout.write(data);
      });
    }

    // Add a `proc.stderr` data listener if `options.logOutput` is `true`
    // or the caller didn't provide their own handler.
    if (options.logOutput || !options.onStderrData) {
      proc.stderr.on('data', (data) => {
        if (LOG_PREFIX && !stderrDataReceived) {
          process.stderr.write(LOG_PREFIX);
          stderrDataReceived = true;
        }

        data = data.toString('utf8');
        if (LOG_PREFIX) {
          data = data.replace(/\n/g, `\n${LOG_PREFIX}`);
        }
        process.stderr.write(data);
      });
    }

    if (options.onStdoutData) {
      // caller provided their own `proc.stdout` data handler
      proc.stdout.on('data', options.onStdoutData);
    }

    if (options.onStderrData) {
      // caller provided their own `proc.stderr` data handler
      proc.stderr.on('data', options.onStderrData);
    }

    proc.on('error', (err) => {
      reject(err);
    });

    proc.on('close', (code) => {
      // Add a separator line to log output
      if (stdoutDataReceived) {
        console.log();
      }

      if (stderrDataReceived) {
        console.error();
      }

      if (code === 0) {
        resolve({});
      } else {
        const err = new Error(`Error spawning "${command} ${args.join(' ')}". Non-zero exit code (code: ${code}).`);
        err.code = code;
        // Stack is not helpful for our use case
        delete err.stack;
        reject(err);
      }
    });
  });
};
