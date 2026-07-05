const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nxhmuwlnrbzydtiugehx.supabase.co';
const supabaseKey = 'sb_publishable_rExk8hZXYiPmOGW6ZxurKQ_77R1DHUR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('operations').insert({
    id: 'test-' + Date.now(),
    board_id: 'board-test',
    type: 'CREATE',
    entity: 'TEST',
    entity_id: 'test',
    payload: '{}',
    timestamp: String(Date.now())
  }).select();

  console.log('Insert Result:', { data, error });
}

test();
