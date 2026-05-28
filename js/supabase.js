// =================================
// SUPABASE CONFIG
// =================================

const SUPABASE_URL =
  "https://mgvcbeborttkqbsrtzkg.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndmNiZWJvcnR0a3Fic3J0emtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTQ2MTIsImV4cCI6MjA5MzY5MDYxMn0.8FUI9J8mTt41W9xmD7fE2V5qmVVScmSgCcuXGIiPDgE";

// =================================
// CLIENT
// =================================

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

// =================================
// TEST
// =================================

async function testSupabase() {

  const { data, error } =
    await supabaseClient
      .from("productos")
      .select("*")
      .limit(1);

  if (error) {

    console.error(
      "Supabase error:",
      error
    );

    return;
  }

  console.log(
    "Supabase conectado",
    data
  );
}

testSupabase();