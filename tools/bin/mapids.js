const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./results.json', 'utf8'));

const modified = data.map(i => {
  return { 
    relationship: {
      _id: i._id
    }
  };
});
fs.writeFileSync('bulkDelete.json', JSON.stringify(modified, null, 2));