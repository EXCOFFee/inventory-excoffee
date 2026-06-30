const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dataDir = process.env.LOCAL_PG_DATA_DIR || path.join(rootDir, '.local-pgdata');
const port = process.env.LOCAL_PG_PORT || '55432';

function getCandidateBinDirs() {
  const dirs = [];

  if (process.env.PG_BIN) {
    dirs.push(process.env.PG_BIN);
  }

  if (process.platform === 'win32') {
    dirs.push(
      'C:/Program Files/PostgreSQL/18/bin',
      'C:/Program Files/PostgreSQL/17/bin',
      'C:/Program Files/PostgreSQL/16/bin',
      'C:/Program Files/PostgreSQL/15/bin'
    );
  } else {
    dirs.push('/usr/local/bin', '/usr/bin');
  }

  return dirs;
}

function resolveBinary(baseName) {
  const fileName = process.platform === 'win32' ? `${baseName}.exe` : baseName;

  for (const binDir of getCandidateBinDirs()) {
    const fullPath = path.join(binDir, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return fileName;
}

function run(bin, args) {
  const result = spawnSync(bin, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to execute ${bin}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function initCluster() {
  if (fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });

  const initdb = resolveBinary('initdb');
  run(initdb, ['-D', dataDir, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8']);
}

function startDb() {
  initCluster();
  const pgCtl = resolveBinary('pg_ctl');
  const logFile = path.join(dataDir, 'postgres.log');
  run(pgCtl, ['-D', dataDir, '-l', logFile, '-o', `-p ${port}`, 'start']);
}

function stopDb() {
  const pgCtl = resolveBinary('pg_ctl');
  run(pgCtl, ['-D', dataDir, '-m', 'fast', 'stop']);
}

function statusDb() {
  const pgCtl = resolveBinary('pg_ctl');
  run(pgCtl, ['-D', dataDir, 'status']);
}

const command = process.argv[2];

if (!command || !['up', 'down', 'status', 'init'].includes(command)) {
  console.log('Usage: node scripts/local-db.js <up|down|status|init>');
  process.exit(1);
}

if (command === 'init') {
  initCluster();
  console.log(`Local PostgreSQL cluster initialized at: ${dataDir}`);
  process.exit(0);
}

if (command === 'up') {
  startDb();
  process.exit(0);
}

if (command === 'down') {
  stopDb();
  process.exit(0);
}

if (command === 'status') {
  statusDb();
  process.exit(0);
}
