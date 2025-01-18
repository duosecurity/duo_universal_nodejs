// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest';
import { util } from '../../src';

describe('Test random string generation function', () => {
  it('should generate random string of given length', () => {
    const randomString = util.generateRandomString(36);

    expect(typeof randomString).toBe('string');
    expect(randomString.length).toBe(36);
  });

  it('should generate random strings', () => {
    expect(util.generateRandomString(36)).not.toBe(util.generateRandomString(36));
  });
});
