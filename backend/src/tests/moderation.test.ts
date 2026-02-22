/**
 * Content Moderation Tests
 * Tests for the reporting system and automatic flagging
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import pool from '../config/database';

describe('Content Moderation System', () => {
  let authToken: string;
  let userId: string;
  let postId: string;
  let reporterTokens: string[] = [];
  let reporterIds: string[] = [];

  beforeAll(async () => {
    // Create test user (post author)
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!@#',
      });

    authToken = userRes.body.token;
    userId = userRes.body.user.id;

    // Create test post
    const postRes = await request(app)
      .post('/api/community/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'This is a test post for moderation',
      });

    postId = postRes.body.data.id;

    // Create 3 reporter users
    for (let i = 0; i < 3; i++) {
      const reporterRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: `reporter_${Date.now()}_${i}`,
          email: `reporter_${Date.now()}_${i}@example.com`,
          password: 'Test123!@#',
        });

      reporterTokens.push(reporterRes.body.token);
      reporterIds.push(reporterRes.body.user.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (postId) {
      await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
    }
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    for (const reporterId of reporterIds) {
      await pool.query('DELETE FROM users WHERE id = $1', [reporterId]);
    }
    await pool.end();
  });

  it('should create a report for a post', async () => {
    const res = await request(app)
      .post(`/api/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterTokens[0]}`)
      .send({
        reason: 'Spam',
        description: 'This post contains spam content',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.flagged).toBe(false); // Not flagged yet (only 1 report)
  });

  it('should prevent duplicate reports from the same user', async () => {
    const res = await request(app)
      .post(`/api/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterTokens[0]}`)
      .send({
        reason: 'Spam',
        description: 'Duplicate report',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already reported');
  });

  it('should not flag post with 2 reports', async () => {
    const res = await request(app)
      .post(`/api/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterTokens[1]}`)
      .send({
        reason: 'Inappropriate',
        description: 'Second report',
      });

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(false); // Not flagged yet (only 2 reports)
  });

  it('should automatically flag post with 3+ reports', async () => {
    const res = await request(app)
      .post(`/api/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterTokens[2]}`)
      .send({
        reason: 'Harassment',
        description: 'Third report - should trigger flag',
      });

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(true); // Should be flagged now (3 reports)

    // Verify post is flagged in database
    const postCheck = await pool.query(
      'SELECT flagged_for_review FROM posts WHERE id = $1',
      [postId]
    );
    expect(postCheck.rows[0].flagged_for_review).toBe(true);
  });

  it('should retrieve flagged posts', async () => {
    const res = await request(app)
      .get('/api/community/moderation/flagged')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const flaggedPost = res.body.data.find((p: any) => p.id === postId);
    expect(flaggedPost).toBeDefined();
    expect(flaggedPost.pending_report_count).toBe(3);
    expect(flaggedPost.reports).toHaveLength(3);
  });

  it('should retrieve reports with flagged status', async () => {
    const res = await request(app)
      .get('/api/community/reports?status=pending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const postReports = res.body.data.filter((r: any) => r.post_id === postId);
    expect(postReports.length).toBe(3);
    expect(postReports[0].flagged_for_review).toBe(true);
    expect(postReports[0].report_count).toBe('3');
  });

  it('should remove post when report is reviewed with remove action', async () => {
    // Get a report ID
    const reportsRes = await request(app)
      .get('/api/community/reports?status=pending')
      .set('Authorization', `Bearer ${authToken}`);

    const report = reportsRes.body.data.find((r: any) => r.post_id === postId);

    const res = await request(app)
      .put(`/api/community/reports/${report.id}/review`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        action: 'remove',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify post is deleted
    const postCheck = await pool.query(
      'SELECT is_deleted, flagged_for_review FROM posts WHERE id = $1',
      [postId]
    );
    expect(postCheck.rows[0].is_deleted).toBe(true);
    expect(postCheck.rows[0].flagged_for_review).toBe(false);
  });
});
