require('dotenv').config();
const fs = require('fs');
const hf = require('./lib/hfClient');
const supabase = require('./lib/supabaseClient');

async function main(){
  const file = __dirname + '/data/seed_documents.json';
  const data = JSON.parse(fs.readFileSync(file,'utf8'));
  for(const doc of data){
    console.log('Embedding:', doc.title);
    const embedding = await hf.embed(doc.body);
    const { error } = await supabase.from('documents').insert([{ title: doc.title, body: doc.body, metadata: doc.metadata||{}, embedding }]);
    if(error) console.error('Insert error', error); else console.log('Inserted:', doc.title);
  }
  console.log('Seeding done');
}

main().catch(err=>{ console.error(err); process.exit(1); });