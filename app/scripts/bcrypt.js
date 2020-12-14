const bcrypt = require('bcrypt')

if (process.argv.length < 3) {
  console.log('Usage: node bcrypt.js password [rounds]')
  process.exit(1)
}

const password = process.argv[2]
const rounds = (process.argv[3]) ? parseInt(process.argv[3]) : 13

console.log(bcrypt.hashSync(password, rounds))
