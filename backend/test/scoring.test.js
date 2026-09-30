import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../src/services/scoring.js';

describe('Lead Scoring Engine', () => {
  it('assigns 100 to Converted leads regardless of other factors', () => {
    const score = computeScore({ status: 'Converted', source: 'Other' }, 0);
    assert.equal(score, 100);
  });

  it('assigns 0 to Lost leads regardless of other factors', () => {
    const score = computeScore({ status: 'Lost', source: 'Referral' }, 10);
    assert.equal(score, 0);
  });

  it('correctly scores a New lead from Referral', () => {
    // New (20) + Referral (15) = 35
    const score = computeScore({ status: 'New', source: 'Referral' }, 0);
    assert.equal(score, 35);
  });

  it('adds follow-up bonuses up to maximum of 4 points', () => {
    // Interested (60) + LinkedIn (10) + 2 follow-ups (4) = 74
    const score = computeScore({ status: 'Interested', source: 'LinkedIn' }, 2);
    assert.equal(score, 74);

    // 5 follow-ups should still cap at 4 points bonus
    const scoreCapped = computeScore({ status: 'Interested', source: 'LinkedIn' }, 5);
    assert.equal(scoreCapped, 74);
  });

  it('penalizes contacts older than 30 days', () => {
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    // Interested (60) + Website (10) - 30 = 40
    const score = computeScore({
      status: 'Interested',
      source: 'Website',
      last_contacted_at: thirtyFiveDaysAgo,
    }, 0);
    assert.equal(score, 40);
  });

  it('rewards recent contacts within 3 days', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    // Contacted (35) + Website (10) + 15 = 60
    const score = computeScore({
      status: 'Contacted',
      source: 'Website',
      last_contacted_at: oneDayAgo,
    }, 0);
    assert.equal(score, 60);
  });

  it('clamps the score between 0 and 100', () => {
    const ancientDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const minScore = computeScore({
      status: 'New',
      source: 'Other',
      last_contacted_at: ancientDate,
    }, 0);
    assert.ok(minScore >= 0 && minScore <= 100);
  });
});
