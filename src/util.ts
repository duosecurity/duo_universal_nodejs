// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import { randomBytes } from 'crypto';

function bytesToBase64url(s: Buffer): string {
  return s.toString('base64').replace(/\+/g, 'Z').replace(/\//g, 'Z');
}

export const generateRandomString = (length: number): string => {
  return bytesToBase64url(randomBytes(length)).substring(0, length);
};

export const getTimeInSeconds = (date = new Date(Date.now())): number =>
  Math.round(date.getTime() / 1000);
