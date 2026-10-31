/** Cambiar de vista dentro del panel del viaje (ver page.tsx: todo vive en el `#`). */
export const ir = (hash: string) => {
  window.location.hash = hash;
  window.scrollTo({ top: 0 });
};
