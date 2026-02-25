if (typeof global !== "undefined" && typeof (global as any).__reanimatedLoggerConfig === "undefined") {
  (global as any).__reanimatedLoggerConfig = { strict: false, strictCopy: false };
}
