declare module "html-to-docx" {
  const convert: (
    html: string,
    header?: string,
    options?: Record<string, unknown>,
    footer?: string,
  ) => Promise<Blob | ArrayBuffer | Buffer>;
  export default convert;
}
