import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'journo_db',
  user: 'postgres',
  password: 'postgres',
});

async function checkPosts() {
  try {
    console.log('Checking posts in database...\n');
    
    // Check total posts
    const totalResult = await pool.query('SELECT COUNT(*) FROM posts');
    console.log(`Total posts: ${totalResult.rows[0].count}`);
    
    // Check non-deleted posts
    const activeResult = await pool.query('SELECT COUNT(*) FROM posts WHERE is_deleted = FALSE');
    console.log(`Active posts: ${activeResult.rows[0].count}`);
    
    // Check posts with trip_id
    const tripPostsResult = await pool.query('SELECT COUNT(*) FROM posts WHERE trip_id IS NOT NULL AND is_deleted = FALSE');
    console.log(`Posts with trips: ${tripPostsResult.rows[0].count}\n`);
    
    // Get recent posts
    const recentResult = await pool.query(`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.trip_id,
        p.engagement_score,
        p.created_at,
        u.name as user_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_deleted = FALSE
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    console.log('Recent posts:');
    recentResult.rows.forEach((post, i) => {
      console.log(`\n${i + 1}. Post ID: ${post.id}`);
      console.log(`   User: ${post.user_name} (${post.user_id})`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log(`   Trip ID: ${post.trip_id || 'none'}`);
      console.log(`   Engagement Score: ${post.engagement_score}`);
      console.log(`   Created: ${post.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPosts();
