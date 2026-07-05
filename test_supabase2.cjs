const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nxhmuwlnrbzydtiugehx.supabase.co', 'sb_publishable_rExk8hZXYiPmOGW6ZxurKQ_77R1DHUR', {
  global: {
    headers: { Authorization: 'Bearer null' }
  }
});
async function test() {
  const { data, error } = await supabase.from('operations').insert({
    id: 'test-' + Date.now(),
    board_id: 'board-test',
    type: 'CREATE',
    entity: 'TEST',
    entity_id: 'test',
    payload: '{}',
    timestamp: String(Date.now())
  });
  console.log('Result:', { error });
}
test();
