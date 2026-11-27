import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Dev-only: stamp every JSX opening tag with data-lp-src="file:line:col" so
 * Design Mode class-flip can map a clicked element back to source.
 */
function lpSrcAttr() {
  return ({ types: t }) => ({
    name: "lp-data-src",
    visitor: {
      JSXOpeningElement(path, state) {
        const loc = path.node.loc;
        if (!loc) return;
        /* Fragments accept only key and children — stamping them made React
         * warn "Invalid prop data-lp-src" on every render, filling the
         * console badge with our own noise. Covers Fragment and
         * React.Fragment; the shorthand form never reaches this visitor. */
        const nameNode = path.node.name;
        const isFragment =
          (nameNode.type === "JSXIdentifier" && nameNode.name === "Fragment") ||
          (nameNode.type === "JSXMemberExpression" && nameNode.property.name === "Fragment");
        if (isFragment) return;
        const filename = state.filename || state.file?.opts?.filename || "";
        const norm = String(filename).replace(/\\/g, "/");
        const idx = norm.lastIndexOf("/src/");
        if (idx === -1) return;
        const file = "src/" + norm.slice(idx + "/src/".length);
        const has = path.node.attributes.some(
          (a) => a && a.type === "JSXAttribute" && a.name && a.name.name === "data-lp-src",
        );
        if (has) return;
        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-lp-src"),
            t.stringLiteral(file + ":" + loc.start.line + ":" + loc.start.column),
          ),
        );
      },
    },
  });
}

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [lpSrcAttr()],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    // The preview runs in an iframe on a different origin, so allow it.
    cors: true,
    /* Vite 6 refuses any request whose Host header it doesn't recognise —
     * DNS-rebinding protection — and answers "Blocked request. This host
     * (...) is not allowed." The live preview is served from a per-sandbox
     * hostname like sb-19vxzh639zu0.vercel.run, so without this the preview
     * pane shows that message instead of the app, on every project.
     *
     * Listed rather than `true`: a leading dot matches subdomains, so the
     * sandbox and preview domains are permitted and the protection still
     * stands for everything else. */
    allowedHosts: [".vercel.run", ".vercel.app", "localhost", "127.0.0.1"],
  },
});
