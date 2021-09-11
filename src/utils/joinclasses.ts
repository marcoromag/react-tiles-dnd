export const jc = (...s: (string | null | undefined | false)[]) =>
  s.filter(val => !!val).join(' ');
