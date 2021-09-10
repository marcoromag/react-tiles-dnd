/*
 * 2020-2021 (C) - OneOverZero AG - MR,FG
 */

export const jc = (...s: (string | null | undefined | false)[]) =>
  s.filter(val => !!val).join(' ');
