const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith("page.tsx")) results.push(file);
    }
  });
  return results;
}

const files = walk("src/app/dashboard/[slug]/event-works");

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");

  if (content.includes("context.role")) {
    const regex1 = /!\[([^\]]+)\]\.includes\(context\.role\)/g;
    let match;
    let replaced = false;
    while ((match = regex1.exec(content)) !== null) {
      const roles = match[1];
      const arrayString = `[${roles}]`;
      const replacement = `(!${arrayString}.includes(context.role) && !context.memberRoles.some(r => ${arrayString}.includes(r)))`;

      content = content.replace(match[0], replacement);
      replaced = true;
    }

    if (replaced) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
}
