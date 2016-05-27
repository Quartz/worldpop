var shellCmd;

function generateShellCmd (buildArg, qzdataPath, thingName) {
  var baseCmd = './__build.sh ' + qzdataPath + ' ' + thingName + ' '; // then commit? push?
  switch (buildArg) {
    case 'move':
      shellCmd = baseCmd + 'false false';
      break;
    case 'commit':
      shellCmd = baseCmd + 'true false';
      break;
    case 'push':
      shellCmd = baseCmd + 'true true';
      break;
    default:
      shellCmd = 'echo ""';
  }

  return shellCmd;
}

module.exports = {
  generateShellCmd: generateShellCmd
};
