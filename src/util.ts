// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

export const generateRandomString = (length: number) => {
  const arr = new Uint8Array((length % 2 ? length + 1 : length) / 2);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (dec) => dec.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

export const getTimeInSeconds = (date = new Date(Date.now())): number =>
  Math.round(date.getTime() / 1000);
