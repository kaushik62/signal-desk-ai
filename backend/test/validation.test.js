import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, SOURCES, STATUSES } from '../src/services/leadService.js';
import { clampDays } from '../src/services/analyticsService.js';

describe('Lead Validation', () => {
  it('validates and sanitizes a valid lead payload', () => {
    const valid = validateLead({
      name: '  Jane Doe  ',
      email: '  JANE@EXAMPLE.COM ',
      company: '  Acme Inc ',
      source: 'LinkedIn',
      status: 'Interested',
      notes: 'Key decision maker',
    });

    assert.equal(valid.name, 'Jane Doe');
    assert.equal(valid.email, 'jane@example.com');
    assert.equal(valid.company, 'Acme Inc');
    assert.equal(valid.source, 'LinkedIn');
    assert.equal(valid.status, 'Interested');
    assert.equal(valid.notes, 'Key decision maker');
  });

  it('rejects an empty name', () => {
    assert.throws(
      () => validateLead({ name: '   ', email: 'test@example.com' }),
      (err) => Boolean(err.status === 400 && err.details?.name)
    );
  });

  it('rejects an invalid email format', () => {
    assert.throws(
      () => validateLead({ name: 'Valid Name', email: 'invalid-email' }),
      (err) => Boolean(err.status === 400 && err.details?.email)
    );
  });

  it('rejects an unrecognized source', () => {
    assert.throws(
      () => validateLead({ name: 'Valid Name', email: 'valid@example.com', source: 'UnknownSource' }),
      (err) => Boolean(err.status === 400 && err.details?.source)
    );
  });

  it('rejects an unrecognized status', () => {
    assert.throws(
      () => validateLead({ name: 'Valid Name', email: 'valid@example.com', status: 'UnknownStatus' }),
      (err) => Boolean(err.status === 400 && err.details?.status)
    );
  });
});

describe('Analytics Day Clamping', () => {
  it('preserves valid days [7, 30, 90]', () => {
    assert.equal(clampDays(7), 7);
    assert.equal(clampDays(30), 30);
    assert.equal(clampDays(90), 90);
  });

  it('defaults invalid days to 30', () => {
    assert.equal(clampDays(15), 30);
    assert.equal(clampDays('abc'), 30);
    assert.equal(clampDays(-5), 30);
    assert.equal(clampDays(null), 30);
  });
});
