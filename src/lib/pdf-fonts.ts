import { Font } from '@react-pdf/renderer';

let registered = false;

/** Roboto fontunu @react-pdf/renderer için kaydet (bir kez çağrılır) */
export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
        fontWeight: 700,
      },
    ],
  });
}
