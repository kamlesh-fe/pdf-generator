import Prism from 'prismjs';
if (typeof globalThis !== 'undefined') {
  globalThis.Prism = Prism;
}
if (typeof window !== 'undefined') {
  window.Prism = Prism;
}
export default Prism;
