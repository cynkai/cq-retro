import fs from "fs";
import path from "path";

export function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function safeMkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function isPathInside(rootPath, candidatePath) {
  const root = fs.realpathSync(rootPath);
  const candidate = path.resolve(candidatePath);
  const lexicalRel = path.relative(path.resolve(rootPath), candidate);
  if (lexicalRel === ".." || lexicalRel.startsWith(`..${path.sep}`) || path.isAbsolute(lexicalRel)) return false;

  let existing = candidate;
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) return false;
    existing = parent;
  }

  const realRel = path.relative(root, fs.realpathSync(existing));
  return realRel !== ".." && !realRel.startsWith(`..${path.sep}`) && !path.isAbsolute(realRel);
}
